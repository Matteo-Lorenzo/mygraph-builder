import { Op, where } from "sequelize";
import { GraphModel, User, History } from "../models";
import { cambia_peso_list, simulation_request } from "../declarations"
import { MyGraphError, generate_pdf } from "../utilities/mylib";
import { authorize_user } from "../utilities/security"
import { StatusCodes } from "http-status-codes";
import { json2csv } from "json-2-csv"

import Graph from 'node-dijkstra'

/*
interface IGraphDataAccess {
    save(graph: GraphModel, current_user_id: number): Promise<GraphModel>;
    // retrieveAll(searchParams: { name: string }): Promise<GraphModel[]>;
    retrieveById(id: number, current_user_id: number): Promise<GraphModel | null>;

    update(graph: GraphModel): Promise<number>;
    delete(GraphId: number): Promise<number>;
    deleteAll(): Promise<number>;

}
*/
type SearchCondition = {
    [key: string]: any;
}

type Grafo = {
    [key: string]: { [key: string]: number };
}

class GraphDataAccess {
    async save(graph: GraphModel, current_user_id: number): Promise<GraphModel> {
        try {
            const foo = graph.initialgraph as any;
            const bar = new Graph(foo as Grafo);        // controllo dijkstra
            graph = GraphModel.build(graph);
            graph.initialgraph = JSON.stringify(graph.initialgraph);  // la stringa passata deve essere un json ben formato
            graph.actualgraph = graph.initialgraph;
        } catch (err) {
            throw new MyGraphError(StatusCodes.INTERNAL_SERVER_ERROR, "Grafo non valido");
        }
        await authorize_user(current_user_id, 'user', graph.get_costo());
        console.log('ddd');
        try {
            graph.user_id = current_user_id;
            // aggiorno il credito dell'utente
            await this.scala_credito(current_user_id, graph.get_costo());
            return await graph.save();
        } catch (err) {
            throw new MyGraphError(StatusCodes.INTERNAL_SERVER_ERROR, "Errore nella creazione del grafo!");
        }
    }

    /*
    async retrieveAll(searchParams: { name?: string }): Promise<GraphModel[]> {
        try {

            console.log(searchParams);

            let condition: SearchCondition = {};

            if (searchParams?.name)
                condition.userid = { [Op.like]: `%${searchParams.name}%` };

            console.log(condition);

            return await GraphModel.findAll({ where: condition });
        } catch (error) {
            throw new MyGraphError(StatusCodes.INTERNAL_SERVER_ERROR, "Errore nel caricamento dei grafi!");
        }
    }
    */

    async retrieveById(id: number, current_user_id: number): Promise<GraphModel | null> {
        await authorize_user(current_user_id, 'user');
        const graph = await GraphModel.findByPk(id);
        if (!(graph instanceof GraphModel)) {
            throw new MyGraphError(StatusCodes.NOT_FOUND, "Grafo non trovato!");
        }
        const the_graph = await GraphModel.findByPk(id);
        // ritorno la versione JSON del grafo
        the_graph!.initialgraph = JSON.parse(the_graph!.initialgraph);
        the_graph!.actualgraph = JSON.parse(the_graph!.actualgraph);
        return the_graph;
    }


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
        await authorize_user(current_user_id, 'user');
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

            const history = new History();
            history.user_id = current_user_id;
            history.changes = JSON.stringify(nuovi_pesi);
            history.graph_id = graph_id;
            history.save();

            const the_graph =  await GraphModel.findByPk(graph_id);
            // ritorno la versione JSON del grafo
            the_graph!.initialgraph = JSON.parse(the_graph!.initialgraph);
            the_graph!.actualgraph = JSON.parse(the_graph!.actualgraph);
            return the_graph;
        } catch (error) {
            throw new MyGraphError(StatusCodes.INTERNAL_SERVER_ERROR, "Errore nell'aggiornamento dei pesi!");
        }
    }

    async execute(graph_id: number, start: string, stop: string, current_user_id: number): Promise<object | null> {
        const graph = await GraphModel.findByPk(graph_id);
        await authorize_user(current_user_id, 'user', graph?.get_costo());
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


    async simulate(graph_id: number, comando: simulation_request, current_user_id: number): Promise<object | null> {
        await authorize_user(current_user_id, 'user');
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


    async get_history(graph_id: number, periodo: string, formato: string, current_user_id: number): Promise<object | string | null> {
        await authorize_user(current_user_id, 'user');


        //  da migliorare
        let criterion = (periodo: string) => {
            const query_periodo = periodo.split('|');
            const start_date = query_periodo[0] + ' 00:00:00.0+02'
            const end_date = query_periodo[1] + ' 23:59:59.0+02'

            console.log(query_periodo);
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


        if (!(graph instanceof GraphModel)) {
            throw new MyGraphError(StatusCodes.NOT_FOUND, "Grafo non trovato!");
        }
        try {
            type info = {
                id: number;
                user_id: number;
                changes: string;
                createdAt: Date;
                updatedAt: Date;
                user: {};
                graphModel: {};
            }
            let dati: object[] = [];
            if (formato === 'csv') {

                graph.history.forEach(element => {
                    console.log(element.dataValues);
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

    async scala_credito(user_id: number, credito: number) {
        // aggiorno il credito dell'utente
        const the_user = await User.findByPk(user_id);
        the_user!.credits -= credito;
        await the_user?.save();
    }

}


export default new GraphDataAccess() as GraphDataAccess;