import { User } from './models'

// struttura dati contenuta nel JSON Web Token
export type jwt_info = {
    user_id: string;
    iat: number;
}

// dati di decodifica del token
export type token_info = {
    is_ok: boolean;
    user: User;
}

// identificazione arco <-> peso associato per poterne effettuare la modifica
export type cambia_peso_info = {
    node_start: string;
    node_stop: string;
    peso: number;
}

// dato strutturato che rappresenta una richiesta di simulazione
export type simulation_request = {
    arco_start: string;
    arco_stop: string;
    peso_start: number;
    peso_stop: number;
    passo: number;
    percorso_start: string;
    percorso_stop: string;
}

// struttura per la richiesta di cambi peso multipli
export type cambia_peso_list = cambia_peso_info[]