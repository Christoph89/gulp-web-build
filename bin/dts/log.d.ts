import { TransformableInfo } from "logform";
export declare enum LogMask {
    none = 0,
    error = 1,
    warn = 3,
    info = 7,
    verbose = 15,
    debug = 31,
    silly = 63
}
export declare var logLevel: string;
export declare var mask: any;
export declare var writeMeta: (msg: TransformableInfo, meta: any) => string;
/** Defines log meta. */
export interface LogMeta {
    error?: any;
    warn?: any;
    info?: any;
    verbose?: any;
    debug?: any;
    silly?: any;
}
export declare function error(msg: string, ...meta: (LogMeta | any)[]): void;
export declare function warn(msg: string, ...meta: (LogMeta | any)[]): void;
export declare function info(msg: string, ...meta: (LogMeta | any)[]): void;
export declare function verbose(msg: string, ...meta: (LogMeta | any)[]): void;
export declare function debug(msg: string, ...meta: (LogMeta | any)[]): void;
export declare function silly(msg: string, ...meta: (LogMeta | any)[]): void;
