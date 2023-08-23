import { Op, where } from "sequelize";
import { GraphModel, User, History, UserRole, Grafo } from "../models";
import { cambia_peso_list, simulation_request } from "../declarations"
import { MyGraphError, generate_pdf, graph2json } from "../utilities/mylib";
import { authorize_user } from "../utilities/security"
import { StatusCodes } from "http-status-codes";
import { json2csv } from "json-2-csv"

import Graph from 'node-dijkstra'


class GraphDataAccess {

    // creazione di un nuovo grafo
    async save(graph: GraphModel, current_user_id: number): Promise<GraphModel> {
        try {
            // richiesta alla libreria di caricare il grafo per controllarne la consistenza
            const foo = graph.initialgraph as any;
            const bar = new Graph(foo as Grafo);        // controllo dijkstra
            graph = GraphModel.build(graph);
            graph.initialgraph = JSON.stringify(graph.initialgraph);  // la stringa passata deve essere un json ben formato
            graph.actualgraph = graph.initialgraph;
        } catch (err) {
            throw new MyGraphError(StatusCodes.INTERNAL_SERVER_ERROR, "Grafo non valido");
        }
        // autorizzazione dell'utente corrente, compreso il controllo del credito
        await authorize_user(current_user_id, UserRole.Utente, graph.get_costo());

        try {
            graph.user_id = current_user_id;
            // aggiorno il credito dell'utente
            await this.scala_credito(current_user_id, graph.get_costo());
            // ritorno la versione JSON del grafo
            return await graph.save().then((the_graph) => graph2json(the_graph!));
        } catch (err) {
            throw new MyGraphError(StatusCodes.INTERNAL_SERVER_ERROR, "Errore nella creazione del grafo!");
        }
    }

    // ricerca di un grafo per chiave primaria
    async retrieveById(id: number, current_user_id: number): Promise<GraphModel | null> {
        // autorizzazione dell'utente corrente
        await authorize_user(current_user_id, UserRole.Tutti);
        const graph = await GraphModel.findByPk(id);
        if (!(graph instanceof GraphModel)) {
            throw new MyGraphError(StatusCodes.NOT_FOUND, "Grafo non trovato!");
        }
        // ritorno la versione JSON del grafo
        return await GraphModel.findByPk(id).then((the_graph) => graph2json(the_graph!));
    }

    // cambia il peso di uno o più archi del grafo
    async cambiaPeso(graph_id: number, nuovi_pesi: cambia_peso_list, current_user_id: number): Promise<GraphModel | null> {
        /* In memoria del codice che fu ....
        // carico l'utente corrente
        const the_user = await User.findByPk(user_id);
        // questa funzione può essere eseguita solo per utenti registrati che ...
        if (the_user === null) {
            throw new MyGraphError(StatusCodes.UNAUTHORIZED,"Utente non registrato");
        };
        // ... hanno il ruolo 'user'
        if (the_user?.role !== 'user') { 
            throw new MyGraphError(StatusCodes.UNAUTHORIZED,"Utente non autorizzato");
        }
        */
       // autorizzazione dell'utente corrente
        await authorize_user(current_user_id, UserRole.Tutti);
        const graph = await GraphModel.findByPk(graph_id);
        if (!(graph instanceof GraphModel)) {
            throw new MyGraphError(StatusCodes.NOT_FOUND, "Grafo non trovato!");
        }
        try {
            // il data access usa le caratteristiche del modello per implementare quanto richiesto dal controller
            nuovi_pesi.forEach(nuovo_peso => {
                // il modello sa modificare un peso
                graph?.set_peso(nuovo_peso.node_start, nuovo_peso.node_stop, nuovo_peso.peso);
            });
            await graph?.save()
            // se sono arrivato qui significa che i pesi sono stati aggiornati nel modello e serializzati nel DB

            // aggiorno la storia delle modifiche
            const history = new History();
            history.user_id = current_user_id;
            history.changes = JSON.stringify(nuovi_pesi);
            history.graph_id = graph_id;
            history.save();

            // ritorno la versione JSON del grafo
            return await GraphModel.findByPk(graph_id).then((the_graph) => graph2json(the_graph!));

        } catch (error) {
            throw new MyGraphError(StatusCodes.INTERNAL_SERVER_ERROR, "Errore nell'aggiornamento dei pesi!");
        }
    }

    // esecuzione del modello per trovare il cammino ottimo tra due nodi dati
    async execute(graph_id: number, start: string, stop: string, current_user_id: number): Promise<object | null> {
        const graph = await GraphModel.findByPk(graph_id);
        // autorizzazione dell'utente corrente, compreso il controllo del credito
        await authorize_user(current_user_id, UserRole.Utente, graph?.get_costo());
        if (!(graph instanceof GraphModel)) {
            throw new MyGraphError(StatusCodes.NOT_FOUND, "Grafo non trovato!");
        }
        const exec_result = graph.execute(start, stop) as { path: string };
        if (exec_result.path === null) {
            throw new MyGraphError(StatusCodes.NOT_FOUND, "Percorso non trovato!");
        }
        try {
            // aggiorno il credito dell'utente
            await this.scala_credito(current_user_id, graph.get_costo());
            return exec_result;
        } catch (error) {
            throw new MyGraphError(StatusCodes.INTERNAL_SERVER_ERROR, "Errore nella valutazione del percorso!");
        }
    }

    // simulazione della ricerca del cammino ottimo al cambio di peso di un arco
    async simulate(graph_id: number, comando: simulation_request, current_user_id: number): Promise<object | null> {
        // autorizzazione dell'utente corrente
        await authorize_user(current_user_id, UserRole.Tutti);
        const graph = await GraphModel.findByPk(graph_id);
        if (!(graph instanceof GraphModel)) {
            throw new MyGraphError(StatusCodes.NOT_FOUND, "Grafo non trovato!");
        }
        try {
            return graph.simulate(comando);
        } catch (error) {
            if (error instanceof MyGraphError) {
                throw error;
            }
            throw new MyGraphError(StatusCodes.INTERNAL_SERVER_ERROR, "Errore nella valutazione del percorso!");
        }
    }

    // produzione di statistiche, in vari formati, relative alla storia delle
    // modifiche apportate ai pesi di un grafo in un determinato periodo di tempo
    async get_history(graph_id: number, periodo: string, formato: string, current_user_id: number): Promise<object | string | null> {
        // autorizzazione dell'utente corrente
        await authorize_user(current_user_id, UserRole.Tutti);
        
        // costruzione dei criteri di selezione dipendentemente dai valori dei parametri della richiesta
        let criterion = (periodo: string) => {
            const query_periodo = periodo.split('|');
            const start_date = query_periodo[0] + ' 00:00:00.0+02'
            const end_date = query_periodo[1] + ' 23:59:59.0+02'

            // data inizio e data fine indicate
            if ((query_periodo[0] !== '') && (query_periodo[1] !== '')) {
                return { updatedAt: { [Op.between]: [start_date, end_date] } };
            }
            // solo data inizio indicata
            else if ((query_periodo[0] !== '') && (query_periodo[1] === '')) {
                return { updatedAt: { [Op.gte]: start_date } };
            }
            // solo data fine indicata
            else if ((query_periodo[0] === '') && (query_periodo[1] !== '')) {
                return { updatedAt: { [Op.lte]: end_date } };
            }
            // ricerca senza date
            else if ((query_periodo[0] === '') && (query_periodo[1] === '')) {
                return {};
            }
        }
        // ricerca utilizzando i criteri appena costruiti
        const graph = await GraphModel.findByPk(graph_id,
            {
                include: [
                    {
                        model: History,
                        where: criterion(periodo),
                        include: [
                            {
                                model: User,
                                attributes: ['email']
                            },
                            {
                                model: GraphModel,
                                attributes: ['name']
                            }
                        ]
                    },
                ],
                order: [
                    [{ model: History, as: 'history' }, 'updatedAt', 'DESC'],
                ],
            });
        
        // controllo dei dati trovati
        if (!(graph instanceof GraphModel)) {
            throw new MyGraphError(StatusCodes.NOT_FOUND, "Dati non disponibili per i criteri di ricerca inseriti!");
        }
        // formattazione della risposta secondo il formato richiesto
        try {
            /*
            type info = {
                id: number;
                user_id: number;
                changes: string;
                createdAt: Date;
                updatedAt: Date;
                user: {};
                graphModel: {};
            }
            */
            let dati: object[] = [];
            if (formato === 'csv') {

                graph.history.forEach(element => {
                    dati.push(element.dataValues);
                });
                return json2csv(dati);
            } else if (formato === 'pdf') {
                const pdf = await generate_pdf(graph.history);
                return pdf;
            }
            graph.history.forEach(element => {
                element.changes = JSON.parse(element.changes);
            });
            return graph.history;
        } catch (error) {
            throw new MyGraphError(StatusCodes.INTERNAL_SERVER_ERROR, "Errore nel calcolo della statistica!");
        }
    }

    // metodo per aggiornare il credito dell'utente
    private async scala_credito(user_id: number, credito: number) {
        const the_user = await User.findByPk(user_id);
        the_user!.credits -= credito;
        await the_user?.save();
    }

}


export default new GraphDataAccess() as GraphDataAccess;