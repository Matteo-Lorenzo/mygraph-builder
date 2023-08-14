import { Table, Column, Model, HasMany, HasOne, BelongsTo, ForeignKey } from 'sequelize-typescript';
import { Optional } from 'sequelize';
import User from './user.model'
import GraphModel from './graph.model'

interface HistoryAttributes {
    id: number;
    changes: string;
    user_id?: number,
    graph_id?: number
}


export interface HistoryCreationAttributes extends Optional<HistoryAttributes, 'id' > { }

@Table({
    tableName: 'history', // Nome della tabella nel database
    timestamps: true, // inclusione degli attributi createdAt e updatedAt
    underscored: true, // utilizzo degli underscores invece del camelCase per i nomi degli attributi
})
class History extends Model<HistoryAttributes, HistoryCreationAttributes>  {
    @ForeignKey(() => User)
    @Column
    user_id!: number;

    @BelongsTo(() => User)
    user!: User;

    @ForeignKey(() => GraphModel)
    @Column
    graph_id!: number;

    @BelongsTo(() => GraphModel)
    graphModel!: GraphModel;

    @Column
    changes!: string;
}

export default History;