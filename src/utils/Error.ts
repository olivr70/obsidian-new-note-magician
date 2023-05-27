/* Credits to SilentVoid13 (https://github.com/SilentVoid13)
 * File copied from SilentVoid13/Templater v1.16 on 27 may 2023
*/

import { log_error } from "./Log";

export class TemplaterError extends Error {
    constructor(msg: string, public console_msg?: string) {
        super(msg);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}

export async function errorWrapper<T>(
    fn: () => Promise<T |null>,
    msg: string
): Promise<T | null> {
    try {
        return await fn();
    } catch (e) {
        if (!(e instanceof TemplaterError)) {
            log_error(new TemplaterError(msg, e.message));
        } else {
            log_error(e);
        }
        return null;
    }
}

export function errorWrapperSync<T>(fn: () => T, msg: string): T | null {
    try {
        return fn();
    } catch (e) {
        log_error(new TemplaterError(msg, e.message));
        return null;
    }
}
