/// <reference types="node" />
import * as ts from "gulp-typescript";
/** Config for building web applications. */
export interface WebBuildConfig {
    minify?: boolean;
    sourcemaps?: boolean;
    tsc?: ts.Settings;
}
/** Merge stream. */
export interface MergedStream extends NodeJS.ReadWriteStream {
    add(source: NodeJS.ReadableStream): MergedStream;
    add(source: NodeJS.ReadableStream[]): MergedStream;
    isEmpty(): boolean;
}
/** Specfies static content. */
export interface StaticContent {
    src: string | string[];
    dest: string | string[];
}
/** Specfies typescript content. */
export interface TSContent {
    src: string;
    js: string;
    dts: string;
    options?: ts.Settings;
    sourcemap?: string;
}
/** Specfies Scss content. */
export interface SCSSContent {
    src: string;
    css: string;
    sourcemap?: string;
}
