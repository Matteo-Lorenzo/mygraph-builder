import dotenv from 'dotenv';
import dbInit from '../db/init';
import { User, GraphModel, UserRole, Grafo, History } from '../models';
import graphDataAccess from '../data_access/graph.data_access';

dotenv.config();


async function createUser(name: string, surname: string, email: string, active: boolean, role: UserRole, credits: number) {
    return User.findOne({ where: { email: email } }).then(
        (user) => {
            if (user !== null) {
                console.log(`Utente ${user.email} già presente in archivio`);
                return user;
            } else {
                const user = User.build({
                    name,
                    surname,
                    email,
                    active,
                    role,
                    credits
                });
                console.log(`Utente ${user.email} inserito in archivio`);
                return user.save();
            }
        }
    );
}

async function createGraph(user: User, name: string, initialgraph: Grafo) {
    return GraphModel.findOne({ where: { name: name } }).then(
        (graph) => {
            if (graph !== null) {
                console.log(`Grafo ${graph.name} già presente in archivio`);
                return graph;
            } else {
                const graph = new GraphModel();
                graph.name = name;
                graph.user_id = user.id,
                    graph.initialgraph = JSON.stringify(initialgraph);
                graph.actualgraph = graph.initialgraph;
                console.log(`Grafo ${graph.name} inserito in archivio`);
                return graph.save();
            }
        }
    );
}




async function seed() {

    let grafoA = {
        "A": { 'B': 1, 'E': 3 },
        "B": { 'C': 2, 'G': 2 },
        "C": { 'D': 2, 'A': 1 },
        "D": { 'E': 1, 'H': 4 },
        "E": { 'F': 3, 'C': 1 },
        "F": { 'G': 2, 'B': 1, 'C': 1 },
        "G": { 'H': 4 },
        "H": { 'A': 3, 'D': 2 },
    }

    let grafoB = {
        "A": { 'D': 1 },
        "B": { 'A': 2, 'E': 2 },
        "C": { 'G': 2 },
        "D": { 'B': 1, 'E': 4, 'H': 3},
        "E": { 'C': 3, 'D': 1, 'H': 2 },
        "F": { 'A': 2, 'C': 1, 'E': 1 },
        "G": { 'F': 4, 'I': 3 },
        "H": { 'G': 3, 'E': 2 },
        "I": { 'B': 3},
    }


    await dbInit();
    console.log('Database collegato...');
    const admin1 = await createUser('Mario', 'Rossi', 'admin1@gmail.com', true, UserRole.Amministratore, 0);
    //const admin2 = await createUser('Luigi', 'Verdi', 'admin2@gmail.com', true, UserRole.Amministratore, 0);
    const user1 = await createUser('Antonio', 'Bianchi', 'user1@gmail.com', true, UserRole.Utente, 15);
    const user2 = await createUser('Paperino', 'Paolino', 'user2@gmail.com', true, UserRole.Utente, 10);

    const grafo1 = await createGraph(user1, 'primoGrafo', grafoA);
    const grafo2 = await createGraph(user2, 'secondoGrafo', grafoB);
    //const grafo3 = await createGraph(user2, 'terzoGrafo', grafo);

    if (await History.count() === 0) {
        console.log('Seed per le modifiche...');
        await graphDataAccess.cambiaPeso(
            grafo1.id,
            [
                {
                    "node_start": "A",
                    "node_stop": "B",
                    "peso": 1
                },
                {
                    "node_start": "C",
                    "node_stop": "D",
                    "peso": 2
                }
            ],
            user1.id)

        await graphDataAccess.cambiaPeso(
            grafo2.id,
            [
                {
                    "node_start": "A",
                    "node_stop": "D",
                    "peso": 1
                },
                {
                    "node_start": "C",
                    "node_stop": "G",
                    "peso": 2
                }
            ],
            user2.id)

    } else {
        console.log('Seed per le modifiche non necessario...');
    }

    console.log(admin1?.toJSON());
    console.log(user1?.toJSON());
    console.log(user2?.toJSON());
    console.log(grafo1?.toJSON());
    console.log(grafo2?.toJSON());

    console.log('Database pronto...');
}



seed();
