import { Op } from "sequelize";
import { GraphModel, User, History } from "../models";
import { cambia_peso_list, cambia_peso_info, token_info } from "../declarations"

interface IGraphDataAccess {
    save(graph: GraphModel): Promise<GraphModel>;
    retrieveAll(searchParams: { name: string }): Promise<GraphModel[]>;
    retrieveById(id: number): Promise<GraphModel | null>;
    /*
    update(graph: GraphModel): Promise<number>;
    delete(GraphId: number): Promise<number>;
    deleteAll(): Promise<number>;
    */
}

interface SearchCondition {
    [key: string]: any;
}

class GraphDataAccess implements IGraphDataAccess {
    async save(graph: GraphModel): Promise<GraphModel> {
        try {
            graph.initialgraph = JSON.stringify(graph.initialgraph);
            graph.actualgraph = graph.initialgraph;
            return await GraphModel.create(graph);
        } catch (err) {
            console.log(err);
            throw new Error("Errore nella creazione del grafo!");
        }
    }

    async retrieveAll(searchParams: { name?: string }): Promise<GraphModel[]> {
        try {

            console.log(searchParams);

            let condition: SearchCondition = {};

            if (searchParams?.name)
                condition.userid = { [Op.like]: `%${searchParams.name}%` };

            console.log(condition);

            return await GraphModel.findAll({ where: condition });
        } catch (error) {
            throw new Error("Errore nel caricamento dei grafi!");
        }
    }

    async retrieveById(id: number): Promise<GraphModel | null> {
        try {
            console.log(id);
            return await GraphModel.findByPk(id);
        } catch (error) {
            throw new Error("Errore nel caricamento del grafo!");
        }
    }

    async cambiaPeso(graph_id: number, nuovi_pesi: cambia_peso_list, user_id: number): Promise<GraphModel | null> {
        // carico l'utente corrente
        const the_user = await User.findByPk(user_id);
        // questa funzione può essere eseguita solo per utenti registrati che ...
        if (the_user === null) {
            throw new Error("Utente non registrato");
        };
        // ... hanno il ruolo 'user'
        if (the_user?.role !== 'user') { 
            throw new Error("Utente non autorizzato");
        }
        try {
                const graph = await GraphModel.findByPk(graph_id);
                // il data access usa le caratteristiche del modello per implementare quanto richiesto dal controller
                nuovi_pesi.forEach(nuovo_peso => {
                    // il modello sa modificare un peso
                    graph?.set_peso(nuovo_peso.node_start, nuovo_peso.node_stop, nuovo_peso.peso);
                });
                await graph?.save()
                // se sono arrivato qui significa che i pesi sono stati aggiornati nel modello e serializzati nel DB

                // verificare come realizzare questa funzione usando sequelize
                const history = new History();
                history.user_id = user_id;
                history.changes = JSON.stringify(nuovi_pesi);
                history.graph_id = graph_id;
                history.save();

                return await GraphModel.findByPk(graph_id);
        } catch (error) {
            throw new Error("Errore nell'aggiornamento dei pesi!");
        }
    }
}


export default new GraphDataAccess();