/// <reference types="node" />
import { Task } from "undertaker";
import { BuildConfig, GulpTask } from "./def";
import { GulpStream } from "./stream";
import { TaskFunction } from "undertaker";
export declare function task(name: string, ...tasks: Task[]): void;
/** Returns a dependency series */
export declare function series(...tasks: Task[]): TaskFunction;
/** Returns a dependency parallel */
export declare function parallel(...tasks: Task[]): TaskFunction;
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
    private static replaceAll;
    private static replace;
    /** Replaces all vars recursive. */
    static replaceVarsRecursive(data: any, vars?: any): any;
    /** Reads the specified file. */
    static read(path: string, vars?: any): string;
    /** Reads all lines from the specified file. */
    static readLines(path: string, vars?: any): string[];
    /** Reads the specified json file. */
    static readJson(path: string, vars?: any): any;
    /** Extends the specified stream. */
    extend(stream: NodeJS.ReadWriteStream, meta?: any): GulpStream;
    /** Return the source stream for the specified path. */
    src(path: string | string[]): GulpStream;
    /** Return the source stream for the specified content. */
    contentSrc(content: any): GulpStream;
    /** Copies the specified source(s) to the specified desination(s). */
    copy(source: string | string[], destination: string | string[]): NodeJS.ReadWriteStream;
}
