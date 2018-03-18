/// <reference types="winston" />
/// <reference types="node" />
import * as winston from "winston";
import { BuildConfig, GulpTask } from "./def";
import { GulpStream } from "./stream";
export declare var log: winston.LoggerInstance;
export declare function task(name: string, fn: () => void): any;
export declare function task(name: string, dependencies: string[], fn: () => void): any;
export declare function task(t: GulpTask, fn: () => void): any;
/** Runs the specified task synchronously. */
export declare function runTask(name: string, ...args: string[]): void;
/** Returns all registered tasks. */
export declare function registeredTasks(): GulpTask[];
/** Zips the specified source(s) to the destination zip. */
export declare function zip(src: string | string[], dest: string): NodeJS.ReadWriteStream;
/** Contains utils for building a web application. */
export declare class BuildUtil {
    cfg: BuildConfig;
    /** Initializes a new instance of WebUtil. */
    constructor(cfg: BuildConfig);
    /** Replaces all vars in the specified path and returns all replaced paths. */
    getPath(path: string | string[], vars?: any): string[];
    /** Replaces all vars in the specified path and returns all replaced paths. */
    static getPath(path: string | string[], vars: any): string[];
    /** Replaces all occurences of the keys specified in vars with its value. */
    static replaceVars(list: string | string[], vars: any, prefix?: string): string[];
    private static replaceAll(list, searchVal, replaceVals);
    private static replace(str, searchVal, replaceVals);
    /** Reads the specified file. */
    static read(path: string, vars?: any): string;
    /** Reads all lines from the specified file. */
    static readLines(path: string, vars?: any): string[];
    /** Reads the specified json file. */
    static readJson(path: string, vars?: any): any;
    /** Extends the specified stream. */
    extend(stream: NodeJS.ReadWriteStream): GulpStream;
    /** Return the source stream for the specified path. */
    src(path: string | string[]): GulpStream;
    /** Return the source stream for the specified content. */
    contentSrc(content: any): GulpStream;
    /** Copies the specified source(s) to the specified desination(s). */
    copy(source: string | string[], destination: string | string[]): any;
    /** Deep-merges the specified json objects. */
    mergeJson(...objects: any[]): any;
}
