import * as typescript from "gulp-typescript";
import { BuildConfig, MergedStream, JavacOptions, SourcemapOptions, TplContent } from "./def";
import { BuildUtil } from "./util";
/** Class for building web applications. */
export declare class Build {
    cfg: BuildConfig;
    util: BuildUtil;
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
    constructor(cfg?: BuildConfig);
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
    addJson(src: string | any, dest: string, extend?: any, base?: any, replaceVars?: boolean): Build;
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
    run(): MergedStream;
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
