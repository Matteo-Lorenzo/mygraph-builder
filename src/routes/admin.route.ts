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
    // Autenticazione: utente registrato e attivo
    // Autorizzazione: ruolo 'admin
    this.router.post("/user", this.userController.create);

    // Recupera un utente per id
    // Autenticazione: utente registrato e attivo
    // Autorizzazione: ruolo 'admin
    this.router.get("/user/:id", this.userController.findOne);

    // Aggiungi credito all'utente con id indicato
    // Autenticazione: utente registrato e attivo
    // Autorizzazione: ruolo 'admin
    this.router.put("/user/refill", this.userController.refill);

    // Attiva utente con id indicato
    // Autenticazione: utente registrato e attivo
    // Autorizzazione: ruolo 'admin
    this.router.put("/user/:id/activate", this.userController.activate);

    // Disattiva utente con id indicato
    // Autenticazione: utente registrato e attivo
    // Autorizzazione: ruolo 'admin
    this.router.put("/user/:id/deactivate", this.userController.deactivate);

    /*
    // Recupera gli utenti secondo i criteri passati attrverso la querystring
    // Autenticazione: utente registrato e attivo
    // Autorizzazione: ruolo 'admin
    this.router.get("/user", this.userController.findAll);
    */
    
  }
}

export default new AdminRoutes().router;