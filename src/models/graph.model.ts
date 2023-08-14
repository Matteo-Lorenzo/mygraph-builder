import { Table, Column, Model, BelongsTo, ForeignKey, HasMany } from 'sequelize-typescript';
import { Optional } from 'sequelize';
import { get_alpha, MyGraphError } from '../utilities/mylib';
import { StatusCodes } from "http-status-codes";


import User from './user.model'
import History from './history.model'


type graph_info = {
    nodi: Set<string>;
    archi: number;
  };

interface GraphAttributes {
    id: number;
    name: string;
    initialgraph: string,
    actualgraph: string,
    user_id?: number
}


export interface GraphCreationAttributes extends Optional<GraphAttributes, 'id' > { }

@Table({
    tableName: 'graph', // Nome della tabella nel database
    timestamps: true, // inclusione degli attributi createdAt e updatedAt
    underscored: true, // utilizzo degli underscores invece del camelCase per i nomi degli attributi
})
class GraphModel extends Model<GraphAttributes, GraphCreationAttributes>  {

    @ForeignKey(() => User)
    @Column
    user_id!: number;

    @BelongsTo(() => User)
    user!: User;

    @Column
    name!: string;

    @Column
    initialgraph!: string;

    @Column
    actualgraph!: string;

    @HasMany(() => History)
    history!: History[];

    // metodi per la gestione dei grafi

      
    private get_info(grafo: object): graph_info {
    
        let info: graph_info = {nodi: new Set<string>(), archi: 0};
    
        for (let nodo in grafo) {
            info.nodi.add(nodo); // aggiungo il nodo al set se non già presente
            // direttiva del compilatore TS per permettere l'accesso all'elemento JSON per nome
            // @ts-ignore
            let archi = grafo[nodo];  // seleziono la descrizione json degli archi e pesi incidenti sul nodo corrente
            for (let nodo in archi) {
                info.nodi.add(nodo); // aggiungo il nodo destinazione dell'arco corrente al set dei nodi se non già presente
                info.archi++; // incremento 
            }
        }
    
        return info;
    }
    
    
    get_costo(): number {
        const info = this.get_info(JSON.parse(this.actualgraph));
        let costo = (0.15 * info.nodi.size) + (0.01 * info.archi)
        return costo
    }
    
    
    get_peso(start: string, stop: string): number {
        let grafo = JSON.parse(this.actualgraph);
        // @ts-ignore
        if (typeof (grafo[start][stop]) === 'number') {
            // @ts-ignore
            return grafo[start][stop]
        } else {
            throw new MyGraphError(StatusCodes.INTERNAL_SERVER_ERROR ,'Qualcosa è andato storto nella ricerca del peso');
        }
    }
    
    set_peso(start: string, stop: string, nuovo_peso: number): void {
        let grafo = JSON.parse(this.actualgraph);
        const alpha = get_alpha();
        console.log(alpha);
        // @ts-ignore
        if (typeof (grafo[start][stop]) === 'number') {
            // @ts-ignore
            const peso_attuale = grafo[start][stop] // estraggo il peso attuale dell'arco
            const peso_calcolato = (alpha * peso_attuale) + ((1 - alpha) * nuovo_peso) // nuovo peso calcolato
            // @ts-ignore
            grafo[start][stop] = peso_calcolato // modifico il peso
            this.actualgraph = JSON.stringify(grafo); // aggiorno la relativa prorietà
        } else {
            throw new MyGraphError(StatusCodes.INTERNAL_SERVER_ERROR ,'Qualcosa è andato storto nella modifica del peso');
        }
    }

}


export default GraphModel;