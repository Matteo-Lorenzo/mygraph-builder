import { CustomError } from 'ts-custom-error'
import { Response } from "express";
import { StatusCodes } from "http-status-codes";


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
 
