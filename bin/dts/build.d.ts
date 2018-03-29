import * as typescript from "gulp-typescript";
import { BuildConfig, StaticContent, JsonContent, TSContent, SCSSContent, JavacOptions, SourcemapOptions, TplContent, JsonFilter, BuildCallback } from "./def";
import { BuildUtil } from "./util";
/** Class for building web applications. */
export declare class Build {
    cfg: BuildConfig;
    util: BuildUtil;
    name: string;
    private buildContent;
    private vscClassPath;
    private classPath;
    private jsonVars;
    vscSettings: any;
    constructor(cfg?: BuildConfig);
    /** Initializes the current build. */
    private init(cfg);
    /** Adds content statically for copying without any building/parsing/etc. */
    add(content: StaticContent): Build;
    add(src: string | string[], dest: string | string[]): Build;
    /** Adds the specified template content. */
    addTpl(content: TplContent): Build;
    addTpl(src: string | string[], path: string | string[], dest: string | string[], data?: any | ((file: any, content: TplContent) => any)): Build;
    /** Adds json content.
     * extend -> merges all json files and extends the merged object
     * base -> takes the base object and merges it with the specified json files
     * you can use the following vars:
     * all keys specified in build config
     * %vscClassPaths = classpaths specified in .vscode settings.json
     * %classPaths = vscClassPaths + all classpaths specified by addJava
     */
    addJson(content: JsonContent): Build;
    addJson(src: string | any, dest: string | any, extend?: any, base?: any, replaceVars?: boolean): Build;
    /** Extends the config by the specified json file. */
    config(src: string | string[] | any, filter?: string[] | JsonFilter | (string[] | JsonFilter)[], replaceVars?: boolean): Build;
    /** Adds typescript content. */
    addTs(content: TSContent): Build;
    addTs(src: string, js: string, dts?: string, sourcemap?: SourcemapOptions, options?: typescript.Settings): Build;
    /** Adds scss content. */
    addScss(content: SCSSContent): Build;
    addScss(src: string, css: string, sourcemap?: SourcemapOptions): Build;
    addJava(src: string, jar: string, classpath?: string | string[], options?: JavacOptions): Build;
    /** Resolve the specified path */
    resolve(path: string | string[]): string[];
    /** Resolves the specified path. */
    resolveFirst(path: string | string[]): string;
    /** Reads the specified file. */
    read(path: string): string;
    /** Reads the specified json file. */
    readJson(path: string): any;
    /** Runs the web build. */
    run(cb: BuildCallback): void;
    private createStream(content);
    private extStream(source, logMsg, content);
    private copyStatic(content);
    private renderTpl(content);
    private extendSourcemapOpts(opts, src, dest);
    private resolveClassPath(path);
    private minifyJs();
    private minifyCss();
    private sourcemapsInit(opt);
    private sourcemapsWrite(opt);
    private dir(path);
    private rename(path);
    private setConfigFromFile(file, content, prop?);
    private filterJson(filter);
    private getJsonVars(vars?);
    private mergeJson(content);
    private buildTs(content);
    private buildScss(content);
    private javac(jar, opt, libs);
    private buildJava(content);
}
