import { Table, Column, Model, BelongsTo, ForeignKey, HasMany, Unique } from 'sequelize-typescript';
import { Optional } from 'sequelize';
import { get_alpha, MyGraphError } from '../utilities/mylib';
import { StatusCodes } from "http-status-codes";
import { simulation_request } from '../declarations';
import Graph from 'node-dijkstra';

import User from './user.model'
import History from './history.model'

// struttura dati per le informazioni sul grafo
type graph_info = {
    nodi: Set<string>;
    archi: number;
};

// struttura dati per il risultato del percorso
type PathResult = {
    path: string[];
    cost: number;
    execution_time: number;
}

// struttura dati per la descrizione del grafo
export type Grafo = {
    [key: string]: { [key: string]: number };
}

// attributi della tabella Graph
interface GraphAttributes {
    id: number;
    name: string;
    initialgraph: string;
    actualgraph: string;
    user_id?: number;
}

// struttura dati di un risultato della simulazione
type peso_info = {
    path: string[];
    cost: number;
    peso: number;
}

// struttura risultato della simulazione
type simul_result = {
    risultati: peso_info[];
    best_result: number;
    best_config: Grafo;
}


export interface GraphCreationAttributes extends Optional<GraphAttributes, 'id'> { }

// utilizzo di sequelize-typescript per la dichiarazione del modello
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

    // costruzione delle info relative al grafo per il calcolo del suo costo
    private get_info(grafo: Grafo): graph_info {

        let info: graph_info = { nodi: new Set<string>(), archi: 0 };

        for (let nodo in grafo) {
            info.nodi.add(nodo); // aggiungo il nodo al set se non già presente
            
            let archi = grafo[nodo];  // seleziono la descrizione json degli archi e pesi incidenti sul nodo corrente
            for (let nodo in archi) {
                info.nodi.add(nodo); // aggiungo il nodo destinazione dell'arco corrente al set dei nodi se non già presente
                info.archi++; // incremento 
            }
        }

        return info;
    }

    // calcolo del costo del grafo
    get_costo(): number {
        const info = this.get_info(JSON.parse(this.actualgraph));
        let costo = (0.15 * info.nodi.size) + (0.01 * info.archi);
        return costo;
    }

    // calcolo del peso dell'arco
    get_peso(start: string, stop: string): number {
        let grafo = JSON.parse(this.actualgraph) as Grafo;
        if (typeof (grafo[start][stop]) === 'number') {
            return grafo[start][stop]
        } else {
            throw new MyGraphError(StatusCodes.INTERNAL_SERVER_ERROR, 'Qualcosa è andato storto nella ricerca del peso');
        }
    }

    // modifica del peso dell'arco
    set_peso(start: string, stop: string, nuovo_peso: number): void {
        let grafo = JSON.parse(this.actualgraph) as Grafo;
        const alpha = get_alpha();
        if (typeof (grafo[start][stop]) === 'number') {
            const peso_attuale = grafo[start][stop] // estraggo il peso attuale dell'arco
            const peso_calcolato = (alpha * peso_attuale) + ((1 - alpha) * nuovo_peso) // nuovo peso calcolato
            grafo[start][stop] = peso_calcolato // modifico il peso
            this.actualgraph = JSON.stringify(grafo); // aggiorno la relativa prorietà
        } else {
            throw new MyGraphError(StatusCodes.INTERNAL_SERVER_ERROR, 'Qualcosa è andato storto nella modifica del peso');
        }
    }

    // esecuzione del grafo
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

    // simulazione del grafo
    simulate(comando: simulation_request): object {

        let stat: simul_result = {
            risultati: [],
            best_result: Number.MAX_VALUE,
            best_config: {}
        };
        const json_graph = JSON.parse(this.initialgraph) as Grafo;
        // ciclo sui valori desiderati del peso
        for (let peso = comando.peso_start; peso <= comando.peso_stop; peso += comando.passo) {
            let the_graph = json_graph;
            if (typeof (the_graph[comando.arco_start][comando.arco_stop]) === 'number') {   // selezione del peso
                the_graph[comando.arco_start][comando.arco_stop] = peso // modifico il peso
                const dijkstra = new Graph(the_graph);
                let result: PathResult = dijkstra.path(comando.percorso_start, comando.percorso_stop, { cost: true }) as PathResult;
                if (result.path === null) {
                    throw new MyGraphError(StatusCodes.BAD_REQUEST, 'Percorso inesistente');
                }
                // costruisco l'elenco dei risultati calcolati
                stat.risultati.push({
                    path: result.path,
                    cost: result.cost,
                    peso: peso
                });
                // selezione del risultato migliore
                if (result.cost < stat.best_result) {
                    stat.best_result = result.cost;
                    stat.best_config = JSON.parse(JSON.stringify(the_graph));   // deep copy
                }
            } else {
                throw new MyGraphError(StatusCodes.INTERNAL_SERVER_ERROR, 'Qualcosa è andato storto nella simulazione');
            }
        }
        // controllo della validità del risultato ottenuto
        if (stat.risultati.length > 0)
            return stat;
        else
            throw new MyGraphError(StatusCodes.INTERNAL_SERVER_ERROR, 'Qualcosa è andato storto nella simulazione');
    }
}


export default GraphModel;