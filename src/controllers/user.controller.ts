import { Request, Response } from "express";
import { User } from "../models";
import userDataAccess from "../data_access/user.data_access";
import { StatusCodes } from "http-status-codes";
import { manage_error } from "../utilities/mylib";

export default class UserController {
    async create(req: Request, res: Response) {
        // business logic
        if (!req.body.email) {
            res.status(StatusCodes.BAD_REQUEST).send({
                message: "email empty!"
            });
            return;
        }

        // interazione con il data access
        try {
            const user: User = req.body;
            if (!user.active) user.active = false;
            console.log(user);
            const savedUser = await userDataAccess.save(user);
            res.status(StatusCodes.CREATED).send(savedUser);
        } catch (err) {
            manage_error(err, res);
        }
    }

    async findAll(req: Request, res: Response) {
        const userid = typeof req.query.userid === "string" ? req.query.userid : "";
        const email = typeof req.query.email === "string" ? req.query.email : "";
        const active = typeof req.query.active === "string" ? (req.query.active === "true") : false;

        console.log("req-query", req.query);

        try {
            const users = await userDataAccess.retrieveAll({ userid, email, active });
            res.status(StatusCodes.OK).send(users);
        } catch (err) {
            manage_error(err, res);
        }
    }

    async findOne(req: Request, res: Response) {
        const id: number = parseInt(req.params.id);

        try {
            const user = await userDataAccess.retrieveById(id);

            if (user instanceof User) {
                res.status(StatusCodes.OK).send(user);
            }
            else
                res.status(StatusCodes.NOT_FOUND).send({
                    message: `Utente con id=${id} non trovato.`
                });
        } catch (err) {
            manage_error(err, res);
        }
    }

    async refill(req: Request, res: Response) {
        const user_id = req.headers['user_id'] as string;
        console.log('Utente corrente ', req.headers['user_id']);
        const id: number = parseInt(req.params.id);

        try {
            const user = await userDataAccess.aggiungiCredito(id, Number(req.body.refill), Number(user_id));
            if (user instanceof User) {
                res.status(StatusCodes.OK).send(user);
            }
            else
                res.status(StatusCodes.NOT_FOUND).send({
                    message: `Utente con id=${id} non trovato.`
                });
        } catch (err) {
            manage_error(err, res);

        }
    }

}