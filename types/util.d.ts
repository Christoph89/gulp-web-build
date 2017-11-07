/// <reference types="node" />
import { WebBuildConfig } from "./def";
import { GulpStream } from "./stream";
export declare function log(msg: string): void;
export declare function logVerbose(msg: string): void;
export declare function task(name: string, fn: () => void): any;
export declare function task(name: string, dependencies: string[], fn: () => void): any;
export declare function clean(paths: string | string[]): any;
/** Contains utils for building a web application. */
export declare class BuildUtil {
    cfg: WebBuildConfig;
    /** Initializes a new instance of WebUtil. */
    constructor(cfg: WebBuildConfig);
    /** Replaces all vars in the specified path and returns all replaced paths. */
    getPath(path: string | string[], vars?: any): string | string[];
    /** Replaces all vars in the specified path and returns all replaced paths. */
    static getPath(path: string | string[], vars: any): string | string[];
    /** Replaces all occurences of the keys specified in vars with its value. */
    static replaceVars(list: string | string[], vars: any, prefix?: string): string[];
    private static replaceAll(list, searchVal, replaceVals);
    private static replace(str, searchVal, replaceVals);
    /** Extends the specified stream. */
    extend(stream: NodeJS.ReadWriteStream): GulpStream;
    /** Return the source stream for the specified path. */
    src(path: string | string[]): GulpStream;
    /** Copies the specified source(s) to the specified desination(s). */
    copy(source: string | string[], destination: string | string[]): any;
}
