import { Router } from "express";
import GrapController from "../controllers/graph.controller";

class AppRoutes {
  router = Router();
  graphController = new GrapController();

  constructor() {
    this.intializeRoutes();
  }

  // rotte per l'utilizzo dell'applicazione

  intializeRoutes() {
    // Crea un nuovo grafo
    // Autenticazione: utente registrato e attivo
    // Autorizzazione: ruolo 'user'
    this.router.post("/graph", this.graphController.create);

    // Recupera un grafo per id
    // Autenticazione: utente registrato e attivo
    // Autorizzazione: ruolo 'user' e 'admin'
    this.router.get("/graph/:id", this.graphController.findOne);

    // Esegui un grafo per id specificando i nodi start e stop
    // Autenticazione: utente registrato e attivo
    // Autorizzazione: ruolo 'user'
    this.router.get("/graph/:id/start/:start/stop/:stop", this.graphController.execute);

    // Cambia peso al grafo con id
    // Autenticazione: utente registrato e attivo
    // Autorizzazione: ruolo 'user' e 'admin'
    this.router.put("/graph/:id", this.graphController.cambiaPeso);

    // Recupera la history del grafo con chiave id
    // Autenticazione: utente registrato e attivo
    // Autorizzazione: ruolo 'user' e 'admin'
    this.router.get("/graph/:id/history", this.graphController.get_history);

    // Simulazione con range di pesi (questa rotta è una POST di interrogazione, non apporta modifiche ai dati)
    // Autenticazione: utente registrato e attivo
    // Autorizzazione: ruolo 'user' e 'admin'
    this.router.post("/graph/:id/simulate", this.graphController.simulate);

    

  }
}

export default new AppRoutes().router;