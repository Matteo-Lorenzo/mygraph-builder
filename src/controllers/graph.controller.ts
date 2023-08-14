import { Request, Response } from "express";
import { GraphModel } from "../models";
import graphDataAccess from "../data_access/graph.data_access";
import { StatusCodes } from "http-status-codes";
import { token_info, cambia_peso_info, cambia_peso_list } from "../declarations"
import { check_token } from "../utilities/security"

export default class GraphController {
    async create(req: Request, res: Response) {
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
            graph.user_id = 1
            const savedGraph = await graphDataAccess.save(graph);
            res.status(StatusCodes.CREATED).send(savedGraph);
        } catch (err) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
                message: "Si è verificato un errore durante la creazione del grafo."
            });
        }
    }

    async findAll(req: Request, res: Response) {
        const name = typeof req.query.name === "string" ? req.query.name : "";

        console.log("req-query", req.query);

        try {
            const graph = await graphDataAccess.retrieveAll({ name });
            res.status(StatusCodes.OK).send(graph);
        } catch (err) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
                message: "Si è verificato un errore durante il recupero dei grafi."
            });
        }
    }

    async findOne(req: Request, res: Response) {
        const id: number = parseInt(req.params.id);

        try {
            const graph = await graphDataAccess.retrieveById(id);

            if (graph) res.status(StatusCodes.OK).send(graph);
            else
                res.status(StatusCodes.NOT_FOUND).send({
                    message: `Grafo con id=${id} non trovato.`
                });
        } catch (err) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
                message: `Errore del server durante la ricerca del grafo.`
            });
        }
    }

    async cambiaPeso(req: Request, res: Response) {
        const user_id = req.headers['user_id'] as string;
        console.log('Utente corrente ', req.headers['user_id']);
        const lista_pesi: cambia_peso_list = req.body;
        // Interazione con il data access
        try {
            const modifiedGraph = await graphDataAccess.cambiaPeso(parseInt(req.params.id), lista_pesi, parseInt(user_id));
            res.status(StatusCodes.CREATED).send(modifiedGraph);
        } catch (err) {
            if (err instanceof Error) {
                res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
                    message: err.message
                });
            } else {
                res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
                    message: "Errore del server durante la modifica del grafo."
                });
            }
        }
    }
}