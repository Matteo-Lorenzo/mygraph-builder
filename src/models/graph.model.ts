import { Table, Column, Model, BelongsTo, ForeignKey, HasMany, Unique } from 'sequelize-typescript';
import { Optional } from 'sequelize';
import { get_alpha, MyGraphError } from '../utilities/mylib';
import { StatusCodes } from "http-status-codes";
import { simulation_request } from '../declarations';
import Graph from 'node-dijkstra';

import User from './user.model'
import History from './history.model'


interface graph_info {
    nodi: Set<string>;
    archi: number;
};


interface PathResult {
    path: string[];
    cost: number;
    execution_time: number;
}

type Grafo = {
    [key: string]: { [key: string]: number };
}


interface GraphAttributes {
    id: number;
    name: string;
    initialgraph: string;
    actualgraph: string;
    user_id?: number;
}

interface peso_info {
    path: string[];
    cost: number;
    peso: number;
}

interface simul_result {
    risultati: peso_info[];
    best_result: number;
    best_config: Grafo;
}


export interface GraphCreationAttributes extends Optional<GraphAttributes, 'id'> { }

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

    @Unique
    @Column
    name!: string;

    @Column
    initialgraph!: string;

    @Column
    actualgraph!: string;

    @HasMany(() => History)
    history!: History[];

    // metodi per la gestione dei grafi


    private get_info(grafo: Grafo): graph_info {

        let info: graph_info = { nodi: new Set<string>(), archi: 0 };

        for (let nodo in grafo) {
            info.nodi.add(nodo); // aggiungo il nodo al set se non già presente
            // direttiva del compilatore TS per permettere l'accesso all'elemento JSON per nome
            // ts-ignore forse serve?
            let archi = grafo[nodo];  // seleziono la descrizione json degli archi e pesi incidenti sul nodo corrente
            for (let nodo in archi) {
                info.nodi.add(nodo); // aggiungo il nodo destinazione dell'arco corrente al set dei nodi se non già presente
                info.archi++; // incremento 
            }
        }

        return info;
    }


    get_costo(): number {
        console.log('get_costo');
        const info = this.get_info(JSON.parse(this.actualgraph));
        let costo = (0.15 * info.nodi.size) + (0.01 * info.archi)
        return costo
    }


    get_peso(start: string, stop: string): number {
        let grafo = JSON.parse(this.actualgraph) as Grafo;
        if (typeof (grafo[start][stop]) === 'number') {
            return grafo[start][stop]
        } else {
            throw new MyGraphError(StatusCodes.INTERNAL_SERVER_ERROR, 'Qualcosa è andato storto nella ricerca del peso');
        }
    }

    set_peso(start: string, stop: string, nuovo_peso: number): void {
        let grafo = JSON.parse(this.actualgraph) as Grafo;
        const alpha = get_alpha();
        console.log(alpha);
        if (typeof (grafo[start][stop]) === 'number') {
            const peso_attuale = grafo[start][stop] // estraggo il peso attuale dell'arco
            const peso_calcolato = (alpha * peso_attuale) + ((1 - alpha) * nuovo_peso) // nuovo peso calcolato
            grafo[start][stop] = peso_calcolato // modifico il peso
            this.actualgraph = JSON.stringify(grafo); // aggiorno la relativa prorietà
        } else {
            throw new MyGraphError(StatusCodes.INTERNAL_SERVER_ERROR, 'Qualcosa è andato storto nella modifica del peso');
        }
    }

    execute(start: string, stop: string): object {
        try {
            const performance_start = performance.now();
            const dijkstra = new Graph(JSON.parse(this.actualgraph));
            let result: PathResult = dijkstra.path(start, stop, { cost: true }) as PathResult;
            result.execution_time = performance.now() - performance_start;
            return result;
        } catch (err) {
            throw new MyGraphError(StatusCodes.INTERNAL_SERVER_ERROR, 'Qualcosa è andato storto nella valutazione del percorso');
        }
    }

 
    simulate(comando: simulation_request): object {

        let stat: simul_result = {
            risultati: [],
            best_result: Number.MAX_VALUE,
            best_config: {}
        };
        const json_graph = JSON.parse(this.initialgraph) as Grafo;
        for (let peso = comando.peso_start; peso <= comando.peso_stop; peso += comando.passo) {
            let the_graph = json_graph;
            if (typeof (the_graph[comando.arco_start][comando.arco_stop]) === 'number') {   // selezione del peso
                the_graph[comando.arco_start][comando.arco_stop] = peso // modifico il peso
                const dijkstra = new Graph(the_graph);
                let result: PathResult = dijkstra.path(comando.percorso_start, comando.percorso_stop, { cost: true }) as PathResult;
                if (result.path === null) {
                    throw new MyGraphError(StatusCodes.BAD_REQUEST, 'Percorso inesistente');
                }

                stat.risultati.push({
                    path: result.path,
                    cost: result.cost,
                    peso: peso
                });
                if (result.cost < stat.best_result) {
                    stat.best_result = result.cost;
                    stat.best_config = JSON.parse(JSON.stringify(the_graph));   // deep copy
                }
            } else {
                throw new MyGraphError(StatusCodes.INTERNAL_SERVER_ERROR, 'Qualcosa è andato storto nella simulazione');
            }
        }
        return stat;
    }
}


export default GraphModel;