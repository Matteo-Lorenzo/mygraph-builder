import { Request, Response } from "express";
import { User, UserRole } from "../models";
import userDataAccess from "../data_access/user.data_access";
import { StatusCodes } from "http-status-codes";
import { manage_error, isNumeric } from "../utilities/mylib";
import { type } from "os";

class UserController {

    // metodo per la gestione della creazione di un nuovo utente
    async create(req: Request, res: Response) {
        // recupero dell'id dell'utente corrente dall'header della richiesta
        const current_user_id = req.headers['current_user_id'] as string;
        // controlli sulla consistenza della richiesta
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

    // metodo per la gestione della ricerca di un utente
    async findOne(req: Request, res: Response) {
        // recupero dei parametri dalla richiesta
        const current_user_id = req.headers['current_user_id'] as string;
        const id: number = parseInt(req.params.id);

        // interazione con il data access
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

    // metodo per la gestione della ricarica del credito di un utente
    async refill(req: Request, res: Response) {
        // validazione dei dati della richiesta
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
        // interazione con il data access
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

    // metodo per la gestione dell'attivazione di un utente
    async activate(req: Request, res: Response) {
        const current_user_id = req.headers['current_user_id'] as string;
        const id: number = parseInt(req.params.id);
        // interazione con il data access
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

    // metodo per la gestione della disattivazione di un utente
    async deactivate(req: Request, res: Response) {
        const current_user_id = req.headers['current_user_id'] as string;
        const id: number = parseInt(req.params.id);
        // interazione con il data access
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


}

export default UserController;