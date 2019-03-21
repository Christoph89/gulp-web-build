import { TransformableInfo } from "logform";
export declare enum LogLevel {
    none = 0,
    error = 1,
    warn = 2,
    info = 4,
    verbose = 8,
    debug = 16,
    silly = 32
}
export declare enum LogMask {
    none = 0,
    error = 1,
    warn = 3,
    info = 7,
    verbose = 15,
    debug = 31,
    silly = 63
}
export declare var mask: LogMask;
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
/** Sets the log mask. */
export declare function setMask(logMask: LogMask): void;
export declare function error(msg: string, ...meta: (LogMeta | any)[]): void;
export declare function warn(msg: string, ...meta: (LogMeta | any)[]): void;
export declare function info(msg: string, ...meta: (LogMeta | any)[]): void;
export declare function verbose(msg: string, ...meta: (LogMeta | any)[]): void;
export declare function debug(msg: string, ...meta: (LogMeta | any)[]): void;
export declare function silly(msg: string, ...meta: (LogMeta | any)[]): void;
