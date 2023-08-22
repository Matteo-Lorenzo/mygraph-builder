import { Op } from "sequelize";
import { User, UserRole } from "../models";
import {authorize_user} from "../utilities/security"
import { MyGraphError } from "../utilities/mylib";
import { StatusCodes } from "http-status-codes";



class UserDataAccess {

    // creazione nuovo utente
    async save(user: User, current_user_id: number): Promise<User> {
        // autorizzazione dell'utente corrente
        await authorize_user(current_user_id, UserRole.Amministratore);
        try {
            return await User.create(user);
        } catch (err) {
            throw new MyGraphError(StatusCodes.INTERNAL_SERVER_ERROR ,"Errore durante la creazione dell'utente!");
        }
    }

    // ricerca di un utente per chiave primaria
    async retrieveById(id: number, current_user_id: number): Promise<User | null> {
        // autorizzazione dell'utente corrente
        await authorize_user(current_user_id, UserRole.Amministratore);
        try {
            return await User.findByPk(id);
        } catch (error) {
            throw new MyGraphError(StatusCodes.INTERNAL_SERVER_ERROR ,"Errore nel caricamento dell'utente");
        }
    }

    // aggiornamento crediti di un utente cercato per email
    async aggiungiCredito(email: string, credito: number, current_user_id: number): Promise<User | null> {
        // autorizzazione dell'utente corrente
        await authorize_user(current_user_id, UserRole.Amministratore);
        try {
            return await User.findOne({where: {email: email}}).then(
                (user) => {
                    user!.credits += credito;
                    return user?.save();
                },
                (err) => {
                    return err;
                });
        } catch (error) {
            throw new MyGraphError(StatusCodes.INTERNAL_SERVER_ERROR ,"Errore nel caricamento del credito");
        }
    }

    // setta lo stato di un utente
    async set_active(id: number, is_active: boolean, current_user_id: number): Promise<User | null> {
        // autorizzazione dell'utente corrente
        await authorize_user(current_user_id, UserRole.Amministratore);
        try {
            return await User.findByPk(id).then(
                (user) => {
                    user!.active = is_active;
                    return user?.save();
                },
                (err) => {
                    return err;
                });
        } catch (error) {
            throw new MyGraphError(StatusCodes.INTERNAL_SERVER_ERROR ,"Errore nel cambio di stato dell'utente");
        }
    }

}

export default new UserDataAccess() as UserDataAccess;