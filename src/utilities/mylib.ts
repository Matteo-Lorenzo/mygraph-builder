import { CustomError } from 'ts-custom-error'
import e, { Response } from "express";
import { StatusCodes } from "http-status-codes";
import { Template, generate, BLANK_PDF } from '@pdfme/generator';
import { GraphModel, User, History } from "../models";


export class MyGraphError extends CustomError {
    public constructor(
        public code: number,
        message?: string,
    ) {
        super(message)
    }
}


export const isNumeric = (val: string): boolean => {
    return !isNaN(Number(val));
}

/*
export function get_alpha(): number{

    let alpha = process.env.ALPHA as string;
    if (isNumeric(alpha) && (Number(alpha) > 0) && (Number(alpha) < 1)) {
        return Number(alpha)
    }
    return 0.9
}
*/

export const get_alpha = (): number => {
    let alpha = process.env.ALPHA as string;
    if (isNumeric(alpha) && (Number(alpha) > 0) && (Number(alpha) < 1)) {
        return Number(alpha)
    }
    return 0.9
}

export const manage_error = (err: any, res: Response) => {
    if (err instanceof MyGraphError) {
        res.status(err.code).send({
            message: err.message
        })
    } else {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
            message: "Errore del Server."
        });
    }
}

export async function generate_pdf(dati: object[]): Promise<Uint8Array> {

    type test = {
        user_id: string;
        graph_id: string;
        changes: string;
        updatedAt: string;
    }

    const column_size = [60, 22, 60, 50];
    const column_content = {
        col1: '',
        col2: '',
        col3: '',
        col4: '',
    };
    let schemas = {};
    let counter = 1;
    let start = 10;
    column_size.forEach(size => {
        schemas = {
            ...schemas, [counter++]: {
                type: 'text',
                position: { x: start, y: 10 },
                width: size,
                height: 1000,
            }
        };
        start += size;
        start += 2;
    });
    console.log(schemas);
    const template: Template = {
        basePdf: BLANK_PDF,
        schemas: [schemas],
    };

    column_content.col1 += 'Utente\n';
    column_content.col1 += '======\n\n';
    column_content.col2 += 'Grafo\n';
    column_content.col2 += '=====\n\n';
    column_content.col3 += 'Modifiche\n';
    column_content.col3 += '=========\n\n';
    column_content.col4 += 'Modificato il\n';
    column_content.col4 += '=============\n\n';

    dati.forEach(element => {
        const storia: History = element as History;
    

        const changes_json = JSON.parse(storia.changes);
        console.log(changes_json);


        for (let index = 0; index < changes_json.length; index++) {
            changes_json[index]['node_start']
            column_content.col3 += `Arco: ${changes_json[index]['node_start']} => ${changes_json[index]['node_stop']} di peso:  ${changes_json[index]['peso']}\n`;
            if (index ===0) {
                column_content.col1 += `${storia.user.email}\n`
                column_content.col2 += `${storia.graphModel.name}\n`
                column_content.col4 += `${new Date(storia.updatedAt).toLocaleString()}\n`
            } else {
                column_content.col1 += '\n'
                column_content.col2 += '\n'
                column_content.col4 += '\n'
            }

        }
    });

    const inputs = [{
        '1': column_content.col1,
        '2': column_content.col2,
        '3': column_content.col3,
        '4': column_content.col4
    }];
    const pdf = await generate({ template, inputs });
    return Buffer.from(pdf.buffer);

}