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

    let grafo = {
        "A": { 'B': 1, 'F': 3 },
        "B": { 'A': 2, 'C': 2, 'D': 4 },
        "C": { 'B': 2, 'D': 1 },
        "D": { 'C': 1, 'B': 4 }
    }


    await dbInit();
    console.log('Database collegato...');
    const admin1 = await createUser('Mario', 'Rossi', 'admin1@gmail.com', true, UserRole.Amministratore, 0);
    const admin2 = await createUser('Luigi', 'Verdi', 'admin2@gmail.com', true, UserRole.Amministratore, 0);
    const user1 = await createUser('Antonio', 'Bianchi', 'user1@gmail.com', true, UserRole.Utente, 15);
    const user2 = await createUser('Paperino', 'Paolino', 'user2@gmail.com', true, UserRole.Utente, 10);

    const grafo1 = await createGraph(user1, 'primoGrafo', grafo);
    const grafo2 = await createGraph(user1, 'secondoGrafo', grafo);
    const grafo3 = await createGraph(user2, 'terzoGrafo', grafo);

    if (await History.count() === 0) {
        console.log('Seed per le modifiche...');
        await graphDataAccess.cambiaPeso(
            grafo1.id,
            [
                {
                    "node_start": "A",
                    "node_stop": "B",
                    "peso": 2
                },
                {
                    "node_start": "C",
                    "node_stop": "D",
                    "peso": 4
                }
            ],
            user1.id)

        await graphDataAccess.cambiaPeso(
            grafo2.id,
            [
                {
                    "node_start": "B",
                    "node_stop": "C",
                    "peso": 2
                },
                {
                    "node_start": "C",
                    "node_stop": "D",
                    "peso": 3
                }
            ],
            user2.id)

        await graphDataAccess.cambiaPeso(
            grafo3.id,
            [
                {
                    "node_start": "A",
                    "node_stop": "B",
                    "peso": 2
                },
                {
                    "node_start": "C",
                    "node_stop": "D",
                    "peso": 4
                }
            ],
            user2.id)
    } else {
        console.log('Seed per le modifiche non necessario...');
    }

    console.log(admin1?.toJSON());
    console.log(admin2?.toJSON());
    console.log(user1?.toJSON());
    console.log(user2?.toJSON());
    console.log(grafo1?.toJSON());
    console.log(grafo2?.toJSON());
    console.log(grafo3?.toJSON());

    console.log('Database pronto...');
}



seed();
