import * as ts from "gulp-typescript";
import * as sourcemaps from "gulp-sourcemaps";

/** Config for building web applications. */
export interface BuildConfig
{
  /** Specifies the project directory. */
  prj?: string;
  /** Specifies whether to minify js/css output. */
  minify?: boolean;
  /** Specifies whether to create sourcemaps for js/css. */
  sourcemaps?: boolean;
  /** Specifies typescript compiler options. */
  tsc?: ts.Settings;
  /** Specifies java compiler options. */
  javac?: JavacOptions;
  /** Specifies custom variables which can be used for paths. */
  [vars: string]: any;
}

/** Merge stream. */
export interface MergedStream extends NodeJS.ReadWriteStream 
{
  add(source: NodeJS.ReadableStream): MergedStream;
  add(source: NodeJS.ReadableStream[]): MergedStream;
  isEmpty(): boolean;
}

/** Java compiler options. */
export interface JavacOptions
{
  // @@todo - see gulp-javac
}

/** Specifies sourcemap options. */
export interface SourcemapOptions extends sourcemaps.InitOptions, sourcemaps.WriteOptions
{
  dest?: string;
}

/** Specfies static content. */
export interface StaticContent
{
  src: string|string[];
  dest: string|string[];
}

/** Specifies template content. */
export interface TplContent
{
  src: string|string[];
  dest: string|string[];
  path: string|string[];
  data?: any | ((file: any, content: TplContent) => any);
}

/** Specfies typescript content. */
export interface TSContent
{
  src: string;
  js: string;
  dts: string;
  options?: ts.Settings;
  sourcemap?: SourcemapOptions;
}

/** Specfies Scss content. */
export interface SCSSContent
{
  src: string;
  css: string;
  sourcemap?: SourcemapOptions;
}

/** Specfies java content. */
export interface JavaContent
{
  src: string;
  jar: string;
  classPath?: string[];
  options?: any;
}

/** Specifies json content. */
export interface JsonContent
{
  src: string|any;
  dest: string;
  base?: any;
  extend?: any;
  replaceVars?: boolean;
}

/** Specifies a gulp task. */
export interface GulpTask
{
  name: string;
  group?: "build" | "test" | "none";
  dependencies?: string[]
  args?: string[]
}