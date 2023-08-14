import { Router } from "express";
import UserController from "../controllers/user.controller";

class AdminRoutes {
  router = Router();
  userController = new UserController();

  constructor() {
    this.intializeRoutes();
  }

  // rotte dell'amministratore

  intializeRoutes() {
    // Crea un nuovo utente
    this.router.post("/user", this.userController.create);

    // Recupera gli utenti secondo i criteri passati attrverso la querystring
    this.router.get("/user", this.userController.findAll);

    // Recupera un utente per id
    this.router.get("/user/:id", this.userController.findOne);

    // Aggiungi credito all'utente con id indicato
    this.router.put("/user/:id/refill", this.userController.refill);

    
  }
}

export default new AdminRoutes().router;