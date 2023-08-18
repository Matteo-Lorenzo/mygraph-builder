import express, { Express } from 'express';
import dotenv from 'dotenv';
import dbInit from './src/db/init'
import bodyParser from 'body-parser';
import { decode_token } from './src/utilities/security'
import { get_alpha } from './src/utilities/mylib'

import { adminRoutes, appRoutes } from './src/routes'

dotenv.config();

// carico le variabili d'ambiente
const port = process.env.PORT;

// Inizializzazione del database postgres
dbInit()

// instanzio l'applicazione express
const app: Express = express();

// attivo i middleware per la parsificazione in json del body
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// attivo il middleware personalizzato per la decodifica del token e 
// l'inserimento del current_user_id nell'header della richiesta per averlo
// disponibile in qualsisi punto della catena di gestione delle rotte
app.use(decode_token);


// attivazione dei middleware per la gestione delle rotte
// realizzati utilizzando la classe Router di express
app.use("/api/admin", adminRoutes);
app.use("/api/app", appRoutes);


// attivo il listener del server sulla porta definita nel file .env
app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});