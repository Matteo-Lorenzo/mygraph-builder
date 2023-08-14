import { User } from './models'


export type jwt_info = {
    user_id: string,
    iat: number
}

export type token_info = {
    is_ok: boolean,
    user: User
}


export type cambia_peso_info = {
    node_start: string,
    node_stop: string,
    peso: number
}

export type cambia_peso_list = cambia_peso_info[]