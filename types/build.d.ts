import * as typescript from "gulp-typescript";
import { WebBuildConfig, MergedStream } from "./def";
import { BuildUtil } from "./util";
/** Class for building web applications. */
export declare class WebBuild {
    cfg: WebBuildConfig;
    util: BuildUtil;
    private stream;
    private staticContent;
    private tsContent;
    private scssContent;
    constructor(cfg?: WebBuildConfig);
    /** Adds content statically for copying without any building/parsing/etc. */
    add(src: string | string[], dest: string | string[]): WebBuild;
    /** Adds typescript content. */
    addTs(src: string, js: string, dts?: string, sourcemap?: string, options?: typescript.Settings): WebBuild;
    /** Adds scss content. */
    addScss(src: string, css: string, sourcemap?: string): WebBuild;
    /** Runs the web build. */
    run(): MergedStream;
    private copyStatic(content);
    private minifyJs();
    private minifyCss();
    private sourcemapsInit();
    private sourcemapsWrite(path?);
    private ensureFileName(path, src, ext);
    private dir(path);
    private rename(path);
    private buildTs(content);
    private buildScss(content);
}
