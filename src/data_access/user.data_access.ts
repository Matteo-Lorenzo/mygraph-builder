import { Op } from "sequelize";
import { User } from "../models";
import {authorize_user} from "../utilities/security"
import { MyGraphError } from "../utilities/mylib";
import { StatusCodes } from "http-status-codes";

interface IUserDataAccess {
    save(user: User, current_user_id: number): Promise<User>;
    // retrieveAll(searchParams: { email: string, active: boolean }, current_user_id: number): Promise<User[]>;
    retrieveById(id: number, current_user_id: number): Promise<User | null>;
    /*
    update(user: User): Promise<number>;
    delete(userId: number): Promise<number>;
    deleteAll(): Promise<number>;
    */
}

interface SearchCondition {
    [key: string]: any;
}

class UserDataAccess implements IUserDataAccess {
    async save(user: User, current_user_id: number): Promise<User> {
        await authorize_user(current_user_id, 'admin');
        try {
            return await User.create(user);
        } catch (err) {
            console.log(err);
            throw new MyGraphError(StatusCodes.INTERNAL_SERVER_ERROR ,"Errore durante la creazione dell'utente!");
        }
    }

    /*
    async retrieveAll(searchParams: { userid?: string, email?: string, active?: boolean }, current_user_id: number): Promise<User[]> {
        try {

            console.log(searchParams);

            let condition: SearchCondition = {};

            if (searchParams?.userid)
                condition.userid = { [Op.like]: `%${searchParams.userid}%` };

            if (searchParams?.email)
                condition.email = { [Op.like]: `%${searchParams.email}%` };

            condition.active = searchParams?.active;

            console.log(condition);

            return await User.findAll({ where: condition });
        } catch (error) {
            throw new MyGraphError(StatusCodes.INTERNAL_SERVER_ERROR ,"Errore nel caricamento degli utenti");
        }
    }
    */

    async retrieveById(id: number, current_user_id: number): Promise<User | null> {
        await authorize_user(current_user_id, 'admin');
        try {
            return await User.findByPk(id);
        } catch (error) {
            throw new MyGraphError(StatusCodes.INTERNAL_SERVER_ERROR ,"Errore nel caricamento dell'utente");
        }
    }

    async aggiungiCredito(email: string, credito: number, current_user_id: number): Promise<User | null> {
        await authorize_user(current_user_id, 'admin');
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

    async set_active(id: number, is_activa: boolean, current_user_id: number): Promise<User | null> {
        await authorize_user(current_user_id, 'admin');
        try {
            return await User.findByPk(id).then(
                (user) => {
                    user!.active = is_activa;
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

export default new UserDataAccess();