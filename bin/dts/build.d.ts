import * as typescript from "gulp-typescript";
import { BuildConfig, MergedStream, JavacOptions, SourcemapOptions, TplContent, JsonResultMap } from "./def";
import { BuildUtil } from "./util";
/** Class for building web applications. */
export declare class Build {
    cfg: BuildConfig;
    util: BuildUtil;
    private series;
    private stream;
    private staticContent;
    private tplContent;
    private jsonContent;
    private tsContent;
    private scssContent;
    private javaContent;
    private vscClassPath;
    private classPath;
    private jsonVars;
    vscSettings: any;
    constructor(cfg?: BuildConfig, series?: BuildSeries);
    /** Initializes the current build. */
    private init(cfg);
    /** Adds content statically for copying without any building/parsing/etc. */
    add(src: string | string[], dest: string | string[]): Build;
    /** Adds the specified template content. */
    addTpl(src: string | string[], path: string | string[], dest: string | string[], data?: any | ((file: any, content: TplContent) => any)): Build;
    /** Adds json content.
     * extend -> merges all json files and extends the merged object
     * base -> takes the base object and merges it with the specified json files
     * you can use the following vars:
     * all keys specified in build config
     * %vscClassPaths = classpaths specified in .vscode settings.json
     * %classPaths = vscClassPaths + all classpaths specified by addJava
     */
    addJson(src: string | any, dest: string | JsonResultMap, extend?: any, base?: any, replaceVars?: boolean): Build;
    /** Sets the config of the current build. */
    setCfg(src: string | any, extend?: any, base?: any, replaceVars?: boolean): Build;
    /** Adds typescript content. */
    addTs(src: string, js: string, dts?: string, sourcemap?: SourcemapOptions, options?: typescript.Settings): Build;
    /** Adds scss content. */
    addScss(src: string, css: string, sourcemap?: SourcemapOptions): Build;
    addJava(src: string, jar: string, classpath?: string | string[], options?: JavacOptions): Build;
    /** Resolve the specified path */
    resolve(path: string): string[];
    /** Resolves the specified path. */
    resolveFirst(path: string): string;
    /** Reads the specified file. */
    read(path: string): string;
    /** Reads the specified json file. */
    readJson(path: string): any;
    /** Runs the web build. */
    run(series_cb?: (error?: any) => void): MergedStream;
    next(): Build;
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
    private getJsonVars();
    private mergeJson(content, vars);
    private buildTs(content);
    private buildScss(content);
    private javac(jar, opt, libs);
    private buildJava(content);
}
/** Defines a build series. */
export declare class BuildSeries {
    /** Initializes a new instance. */
    constructor(builds?: Build[]);
    /** The builds of the series. */
    builds: Build[];
    /** Adds the specified build. */
    add(build: Build): void;
    /** Runs the series. */
    run(cb: (error?: any) => void): void;
}
