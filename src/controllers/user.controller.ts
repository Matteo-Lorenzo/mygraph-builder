import { Request, Response } from "express";
import { User, UserRole } from "../models";
import userDataAccess from "../data_access/user.data_access";
import { StatusCodes } from "http-status-codes";
import { manage_error, isNumeric } from "../utilities/mylib";
import { type } from "os";

class UserController {
    async create(req: Request, res: Response) {
        const current_user_id = req.headers['current_user_id'] as string;
        // business logic
        if (!req.body.email) {
            res.status(StatusCodes.BAD_REQUEST).send({
                message: "email non inserita!"
            });
            return;
        }
        if ((!(req.body.role in UserRole)) || (req.body.role === 'Tutti')) {
            res.status(StatusCodes.BAD_REQUEST).send({
                message: "Ruolo non riconosciuto!"
            });
            return;
        }

        // interazione con il data access
        try {
            const user: User = req.body;
            if (!user.active) user.active = false;
            user.role = UserRole[user.role as keyof typeof UserRole];
            const savedUser = await userDataAccess.save(user, parseInt(current_user_id));
            res.status(StatusCodes.CREATED).send(savedUser);
        } catch (err) {
            manage_error(err, res);
        }
    }

    async findOne(req: Request, res: Response) {
        const current_user_id = req.headers['current_user_id'] as string;
        const id: number = parseInt(req.params.id);

        try {
            const user = await userDataAccess.retrieveById(id, parseInt(current_user_id));

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
        if (typeof req.body.email !== 'string') {
            res.status(StatusCodes.BAD_REQUEST).send({
                message: "Email non presente nella richiesta."
            });
            return;
        }
        if (!(isNumeric(req.body.refill) && (Number(req.body.refill) > 0))) {
            res.status(StatusCodes.BAD_REQUEST).send({
                message: "Valore di refill non accettabile."
            });
            return;
        }
        const current_user_id = req.headers['current_user_id'] as string;
        try {
            const user = await userDataAccess.aggiungiCredito(req.body.email, Number(req.body.refill), parseInt(current_user_id));
            if (user instanceof User) {
                res.status(StatusCodes.OK).send(user);
            }
            else
                res.status(StatusCodes.NOT_FOUND).send({
                    message: `Utente con email=${req.body.email} non trovato.`
                });
        } catch (err) {
            manage_error(err, res);

        }
    }


    async activate(req: Request, res: Response) {
        const current_user_id = req.headers['current_user_id'] as string;
        const id: number = parseInt(req.params.id);

        try {
            const user = await userDataAccess.set_active(id, true, parseInt(current_user_id));
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

    async deactivate(req: Request, res: Response) {
        const current_user_id = req.headers['current_user_id'] as string;
        const id: number = parseInt(req.params.id);

        try {
            const user = await userDataAccess.set_active(id, false, parseInt(current_user_id));
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


    /*
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
    */

}

export default UserController;