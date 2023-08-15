import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from "express";
import userDataAccess from "../data_access/user.data_access";
import { StatusCodes } from "http-status-codes";
import { isNumeric, MyGraphError } from "./mylib";
import { User } from "../models"


import { jwt_info, token_info } from '../declarations'



export async function check_token(req: Request, role: string): Promise<token_info> {
    try {
        const authorization = req.headers.authorization;
        console.log(authorization);
        const token = authorization?.replace("Bearer ", "");
        console.log(token);
        const result = jwt.verify(token!, 'pa2023') as jwt_info;
        console.log(result);

        const the_user = await userDataAccess.retrieveById(parseInt(result.user_id));

        let info: token_info = {} as token_info;

        if (the_user != null) {     // utente trovato
            if (role === '') {      // on sono interessato al tipo di ruolo
                info.is_ok = true
            } else {                // controllo il ruolo
                info.is_ok = the_user?.dataValues.role === role;
            }
            info.user = the_user;   // riporto i dati dell'utente
        } else {                    // utente non trovato
            info.is_ok = false;
        }
        return info;

    } catch (err) {
        throw new MyGraphError(StatusCodes.UNAUTHORIZED, "Token non valido");
    }
}

export function get_token(req: Request): jwt_info {
    try {
        const authorization = req.headers.authorization;
        console.log(authorization);
        const token = authorization?.replace("Bearer ", "");
        console.log(token);
        const result = jwt.verify(token!, 'pa2023') as jwt_info;
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
            req.headers['user_id'] = token.user_id;
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

export async function authorize_user(user_id: number, role: string) {
    // carico l'utente corrente
    const the_user = await User.findByPk(user_id);
    // questa funzione può essere eseguita solo per utenti registrati che ...
    if (the_user === null) {
        throw new MyGraphError(StatusCodes.UNAUTHORIZED, "Utente non registrato");
    };
    if (the_user.active) {
        // ... hanno il ruolo richiesto
        if (role !== "") {
            if (the_user?.role !== role) {
                throw new MyGraphError(StatusCodes.UNAUTHORIZED, "Utente non autorizzato");
            }
        }
    } else {
        throw new MyGraphError(StatusCodes.UNAUTHORIZED, "Utente non attivo");
    }
}

