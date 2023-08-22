import { Request, Response } from "express";
import { GraphModel } from "../models";
import graphDataAccess from "../data_access/graph.data_access";
import { StatusCodes } from "http-status-codes";
import { simulation_request, cambia_peso_list } from "../declarations"
import { manage_error } from "../utilities/mylib";

class GraphController {

    // metodo per la gestione della creazione di un nuovo grafo
    async create(req: Request, res: Response) {
        // recupero dell'id dell'utente corrente dall'header della richiesta
        const current_user_id = req.headers['current_user_id'] as string;
        // controlli sulla consistenza della richiesta
        if (!req.body.name) {
            res.status(StatusCodes.BAD_REQUEST).send({
                message: "Nome vuoto!"
            });
            return;
        }

        // interazione con il data access
        try {
            const graph: GraphModel = req.body;
            const savedGraph = await graphDataAccess.save(graph, parseInt(current_user_id));
            res.status(StatusCodes.CREATED).send(savedGraph);
        } catch (err) {
            manage_error(err, res);
        }
    }


    // metodo per la gestione della ricerca di un grafo
    async findOne(req: Request, res: Response) {
        // recupero dei parametri dalla richiesta
        const current_user_id = req.headers['current_user_id'] as string;
        const id: number = parseInt(req.params.id);
        // interazione con il data access
        try {
            const graph = await graphDataAccess.retrieveById(id, parseInt(current_user_id));

            if (graph) res.status(StatusCodes.OK).send(graph);
            else
                res.status(StatusCodes.NOT_FOUND).send({
                    message: `Grafo con id=${id} non trovato.`
                });
        } catch (err) {
            manage_error(err, res);
        }
    }

    // metodo per la gestione del cambio di peso di uno o più archi del grafo
    async cambiaPeso(req: Request, res: Response) {
         // recupero dei parametri dalla richiesta
        const current_user_id = req.headers['current_user_id'] as string;
        const lista_pesi: cambia_peso_list = req.body;
        // Interazione con il data access
        try {
            const modifiedGraph = await graphDataAccess.cambiaPeso(parseInt(req.params.id), lista_pesi, parseInt(current_user_id));
            res.status(StatusCodes.CREATED).send(modifiedGraph);
        } catch (err) {
            manage_error(err, res);
        }
    }

    // metodo per la gestione dell'esecuzione del modello per trovare il cammino ottimo tra due nodi dati
    async execute(req: Request, res: Response) {
         // recupero dei parametri dalla richiesta
        const current_user_id = req.headers['current_user_id'] as string;
        const id: number = parseInt(req.params.id);
        const start: string = req.params.start;
        const stop: string = req.params.stop;

        // Interazione con il data access
        try {
            const result = await graphDataAccess.execute(id, start, stop, parseInt(current_user_id));
            res.status(StatusCodes.OK).send(result);
        } catch (err) {
            manage_error(err, res);
        }

    }

    // metodo per la gestione della simulazione della ricerca del cammino ottimo al cambio di peso di un arco
    async simulate(req: Request, res: Response) {
         // recupero dei parametri dalla richiesta
        const current_user_id = req.headers['current_user_id'] as string;
        const graph_id: number = parseInt(req.params.id);

        const il_comando: simulation_request = req.body;

       
        //Interazione con il data access
        try {
            const result = await graphDataAccess.simulate(graph_id, il_comando, parseInt(current_user_id));
            res.status(StatusCodes.OK).send(result);
        } catch (err) {
            manage_error(err, res);
        }
    }

    // metodo per la gestione della produzione di statistiche, in vari formati, relative alla
    // storia delle modifiche apportate ai pesi di un grafo in un determinato periodo di tempo
    async get_history(req: Request, res: Response) {
         // recupero e formattazione dei parametri dalla richiesta
        const current_user_id = req.headers['current_user_id'] as string;
        const id: number = parseInt(req.params.id);
        const formato = typeof req.query.formato === "string" ? req.query.formato : "json";
        let periodo = typeof req.query.periodo === "string" ? req.query.periodo : "|";
        if (!periodo.includes("|")) {
            periodo = periodo + '|' + periodo;
        }

        // Interazione con il data access
        try {
            const result = await graphDataAccess.get_history(id, periodo, formato, parseInt(current_user_id));
            if (formato === 'pdf') {
                res.contentType('application/pdf');
                res.setHeader('Content-Disposition', 'attachment; filename=stat.pdf')
                
            }
            res.status(StatusCodes.OK).send(result);
        } catch (err) {
            manage_error(err, res);
        }

    }
}

export default GraphController;