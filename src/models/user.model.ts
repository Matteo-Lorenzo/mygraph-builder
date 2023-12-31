import { Table, Column, Model, HasMany, Unique, DataType } from 'sequelize-typescript';
import { Optional } from 'sequelize';


import GraphModel from './graph.model'
import History from './history.model'

// attributi della tabella User
interface UserAttributes {
    id: number;
    name?: string;
    surname?: string,
    email: string,
    role: string,
    credits: number;
    active: boolean,
}

// possibili ruoli dell'utente
export enum UserRole {
    Tutti = '',
    Amministratore = 'admin',
    Utente = 'user'
}

export interface UserCreationAttributes extends Optional<UserAttributes, 'id'> {}

// utilizzo di sequelize-typescript per la dichiarazione del modello
@Table({
    tableName: 'user', // Nome della tabella nel database
    timestamps: true, // inclusione degli attributi createdAt e updatedAt
    underscored: true, // utilizzo degli underscores invece del camelCase per i nomi degli attributi
})
class User extends Model<UserAttributes, UserCreationAttributes> {
    @Column
    name!: string;

    @Column
    surname!: string;

    @Unique
    @Column
    email!: string;

    @Column
    role!: string;

    @Column(DataType.FLOAT)
    credits!: number;

    @Column
    active!: boolean;

    @HasMany(() => GraphModel)
    graphs!: GraphModel[];

    @HasMany(() => History)
    history!: History[];

}


export default User;