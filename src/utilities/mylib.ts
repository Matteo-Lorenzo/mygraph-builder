
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

