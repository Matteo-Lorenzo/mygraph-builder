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
    this.router.post("/graph", this.graphController.create);

    // Recupera i grafi secondo i criteri passati attrverso la querystring
    this.router.get("/graph", this.graphController.findAll);

    // Recupera un grafo per id
    this.router.get("/graph/:id", this.graphController.findOne);

    // Cambia peso al grafo con id
    this.router.put("/graph/:id", this.graphController.cambiaPeso);

    // Esegui un grafo per id specificando i nodi start e stop
    this.router.get("/graph/:id/start/:start/stop/:stop", this.graphController.execute);

    // Simulazione con range di pesi (questa rotta è una POST di interrogazione, non apporta modifiche ai dati)
    this.router.post("/graph/:id/simulate", this.graphController.simulate);

    // Recupera la history del grafo con chiave id
    this.router.get("/graph/:id/history", this.graphController.get_history);

    // ecc.
  }
}

export default new AppRoutes().router;