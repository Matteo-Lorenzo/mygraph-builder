import { Request, Response } from "express";
import { GraphModel } from "../models";
import graphDataAccess from "../data_access/graph.data_access";
import { StatusCodes } from "http-status-codes";
import { simulation_request, cambia_peso_list } from "../declarations"
import { manage_error } from "../utilities/mylib";

export default class GraphController {
    async create(req: Request, res: Response) {
        console.log('aaa');
        const current_user_id = req.headers['current_user_id'] as string;
        // business logic
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

    /*
    async findAll(req: Request, res: Response) {
        const current_user_id = req.headers['current_user_id'] as string;
        const name = typeof req.query.name === "string" ? req.query.name : "";

        console.log("req-query", req.query);

        try {
            const graph = await graphDataAccess.retrieveAll({ name });
            res.status(StatusCodes.OK).send(graph);
        } catch (err) {
            manage_error(err, res);
        }
    }
    */

    async findOne(req: Request, res: Response) {
        const current_user_id = req.headers['current_user_id'] as string;
        const id: number = parseInt(req.params.id);

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

    async cambiaPeso(req: Request, res: Response) {
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

    async execute(req: Request, res: Response) {
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

    async simulate(req: Request, res: Response) {
        const current_user_id = req.headers['current_user_id'] as string;
        const graph_id: number = parseInt(req.params.id);

        const il_comando: simulation_request = req.body;

        // scrivere una funzione di validazione dei parametri

        console.log(il_comando);
        //res.status(StatusCodes.OK).send(il_comando);

         /* Approccio precedente con rotta con metodo GET e parametri passati tramite querystring abbandonato perchè
            di difficile gestione e controllo dei tipi... inoltre potrebbe presentare limitazioni rispetto al passaggio
            di parametri nel body
        const arco_start = typeof req.query.arco_start === "string" ? req.query.arco_start : "";
        const arco_stop = typeof req.query.arco_stop === "string" ? req.query.arco_stop : "";
        const peso_start = typeof req.query.peso_start === "string" ? parseFloat(req.query.peso_start) : 0.0;
        const peso_stop = typeof req.query.peso_stop === "string" ? parseFloat(req.query.peso_stop) : 0.0;
        const passo = typeof req.query.passo === "string" ? parseFloat(req.query.passo) : 0.0;
        const percorso_start = typeof req.query.percorso_start === "string" ? req.query.percorso_start : "";
        const percorso_stop = typeof req.query.percorso_stop === "string" ? req.query.percorso_stop : "";
        */
       
        //Interazione con il data access
        try {
            const result = await graphDataAccess.simulate(graph_id, il_comando, parseInt(current_user_id));
            res.status(StatusCodes.OK).send(result);
        } catch (err) {
            manage_error(err, res);
        }
    }

    async get_history(req: Request, res: Response) {
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