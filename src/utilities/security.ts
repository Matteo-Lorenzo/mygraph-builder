import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from "express";
import userDataAccess from "../data_access/user.data_access";
import { StatusCodes } from "http-status-codes";
import { isNumeric, MyGraphError } from "./mylib";
import { User, UserRole } from "../models"


import { jwt_info, token_info } from '../declarations'


export function get_token(req: Request): jwt_info {
    try {
        const secret = process.env.SECRET as string;
        const authorization = req.headers.authorization;
        console.log(authorization);
        const token = authorization?.replace("Bearer ", "");
        console.log(token);
        const result = jwt.verify(token!, secret) as jwt_info;
        console.log(result);
        if ((typeof (result.user_id) === 'string') && (isNumeric(result.user_id))) {
            return result;
        } else {
            throw new MyGraphError(StatusCodes.UNAUTHORIZED, "UserID non valido");
        }
    } catch (err) {
        throw new MyGraphError(StatusCodes.UNAUTHORIZED, "Token non valido");
    }
}


export function decode_token(req: Request, res: Response, next: NextFunction) {
    // controllo la presenza del campo Authorization nell'header
    // se presente lo decodifico
    // se la decodifica è andata a buon fine controllo che i dati presenti siano quelli attesi
    // aggiungo all'header il campo UserID con l'identificativo utente estratto dal token e poi... next()
    // altrimenti genero una eccezione

    if (typeof (req.headers.authorization) === 'string') {
        try {
            const token = get_token(req);
            // possono essere qui inseriti ulteriori controlli a piacimento sulla validità del token
            req.headers['current_user_id'] = token.user_id;
            next();
        } catch (error) {
            res.status(StatusCodes.UNAUTHORIZED).send({
                message: "Token non valido"
            });
        }
    } else {
        res.status(StatusCodes.UNAUTHORIZED).send({
            message: "Token non presente"
        });
    }
}

export async function authorize_user(current_user_id: number, role: UserRole, costo_operazione?: number) {
    // carico l'utente corrente
    const the_user = await User.findByPk(current_user_id);
    // questa funzione può essere eseguita solo per utenti registrati che ...
    if (the_user === null) {
        throw new MyGraphError(StatusCodes.UNAUTHORIZED, "Utente non registrato");
    };
    if (the_user.active) {
        // ... hanno il ruolo richiesto
        if ((role !== UserRole.Tutti) && (the_user?.role !== role)) {
                // il ruolo richiesto non è Tutti ed il ruolo dell'utente corrente è diverso da quello richiesto
                throw new MyGraphError(StatusCodes.UNAUTHORIZED, "Utente non autorizzato");
        }
    } else {
        throw new MyGraphError(StatusCodes.UNAUTHORIZED, "Utente non attivo");
    }
    if ((typeof costo_operazione) === 'number') {
        if (costo_operazione! > the_user.credits) {
            throw new MyGraphError(StatusCodes.UNAUTHORIZED, "Non hai credito sufficiente");
        }
    }
}

