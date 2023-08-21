import dotenv from 'dotenv';
import dbInit from '../db/init';
import { User, GraphModel, UserRole, Grafo } from '../models'

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
    const admin1 = await createUser('Mario', 'Rossi', 'mario.rossi@gmail.com', true, UserRole.Amministratore, 0);
    const admin2 = await createUser('Luigi', 'Verdi', 'verdi.luigi@gmail.com', true, UserRole.Amministratore, 0);
    const user1   = await createUser('Antonio', 'Bianchi', 'bianchi.antonio@gmail.com', true, UserRole.Utente, 15);
    const user2   = await createUser('Paperino', 'Paolino', 'paperino.paperino@gmail.com', true, UserRole.Utente, 10);

    const grafo1 = await createGraph(user1, 'primoGrafo', grafo);
    const grafo2 = await createGraph(user1, 'secondoGrafo', grafo);
    const grafo3 = await createGraph(user2, 'terzoGrafo', grafo);

    console.log(admin1?.toJSON());
    console.log(admin2?.toJSON());
    console.log(user1?.toJSON());
    console.log(user2?.toJSON());
    console.log(grafo1?.toJSON());
    console.log(grafo3?.toJSON());
    console.log(grafo3?.toJSON());

    console.log('Database pronto...');
}

seed();
