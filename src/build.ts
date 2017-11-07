import * as linq from "linq";
import * as pathutil from "path";
import * as deepAssign from "deep-assign";
import * as empty from "gulp-empty";
import * as rename from "gulp-rename";
import * as sass from "gulp-sass";
import * as javac from "gulp-javac";
import * as uglify from "gulp-uglify";
import * as uglifycss from "gulp-uglifycss";
import * as typescript from "gulp-typescript";
import * as sourcemaps from "gulp-sourcemaps";
import { WebBuildConfig, MergedStream, StaticContent, TSContent, SCSSContent } from "./def";
import { BuildUtil, log, logVerbose } from "./util";
var mergeStream=require("merge-stream"); // merge-stream does not support ES6 import

/** Class for building web applications. */
export class WebBuild
{
  public cfg: WebBuildConfig;
  public util: BuildUtil;
  private stream: MergedStream;
  private staticContent: StaticContent[]=[];
  private tsContent: TSContent[]=[];
  private scssContent: SCSSContent[]=[];

  public constructor(cfg?: WebBuildConfig)
  {
    if (!cfg) cfg={};
    this.util=new BuildUtil(deepAssign(this.cfg=cfg, <WebBuildConfig> {
      // default config
    }));
    this.stream=mergeStream();
  }

  /** Adds content statically for copying without any building/parsing/etc. */
  public add(src: string|string[], dest: string|string[]): WebBuild
  {
    this.staticContent.push({ src: src, dest: dest });
    return this;
  }

  /** Adds typescript content. */
  public addTs(src: string, js: string, dts?: string, sourcemap?: string, options?: typescript.Settings): WebBuild
  {
    this.tsContent.push({ 
      src: src, 
      js: js, 
      dts: dts, 
      sourcemap: sourcemap,
      options: options 
    });
    return this;
  }

  /** Adds scss content. */
  public addScss(src: string, css: string, sourcemap?: string,): WebBuild
  {
    this.scssContent.push({ 
      src: src, 
      css: this.ensureFileName(css, src, ".css"),
      sourcemap: sourcemap
    });
    return this;
  }

  /** Runs the web build. */
  public run()
  {
    // copy static content
    if (this.staticContent.length)
    {
      log("copy static content");
      linq.from(this.staticContent).forEach(x => this.copyStatic(x));
    }

    // build ts
    if (this.tsContent.length)
      {
      log("build typescript");
      linq.from(this.tsContent).forEach(x => this.buildTs(x));
    }

    // build scss
    if (this.scssContent.length)
    {
      log("build scss");
      linq.from(this.scssContent).forEach(x => this.buildScss(x));
    }

    return this.stream;
  }

  private copyStatic(content: StaticContent)
  {
    this.stream.add(this.util.copy(content.src, content.dest));
  }

  private minifyJs()
  {
    if (this.cfg.minify)
      return uglify({});
    return empty();
  }

  private minifyCss()
  {
    if (this.cfg.minify)
      return uglifycss({});
    return empty();
  }

  private sourcemapsInit()
  {
    if (this.cfg.sourcemaps)
      return sourcemaps.init();
    return empty();
  }

  private sourcemapsWrite(path?: string)
  {
    if (this.cfg.sourcemaps)
      return sourcemaps.write(path);
    return empty();
  }

  private ensureFileName(path: string, src: string, ext: string)
  {
    if (!path)
      return null;
    if (pathutil.extname(path))
      return path;
    if (path[path.length-1]!="/") path+="/"; // ensure trailing /
    return path+pathutil.basename(src).replace(pathutil.extname(src), ext);
  }

  private dir(path: string)
  {
    if (pathutil.extname(path))
      return pathutil.dirname(path);
    return path;
  }

  private rename(path: string)
  {
    if (pathutil.extname(path))
      return rename(pathutil.basename(path));
    return empty()
  }

  private buildTs(content: TSContent)
  {
    // get config
    content.options=deepAssign({}, this.cfg.tsc, content.options);

    // set out filename
    if (pathutil.extname(content.js))
      content.options.out=pathutil.basename(content.js); 

    // set declaration
    if (content.dts)
      content.options.declaration=true;

    // log
    logVerbose("build ts "+JSON.stringify(content));

    // compile ts
    var ts=<any>this.util.src(content.src)
      .pipe(this.sourcemapsInit())
      .pipe(typescript(content.options)).stream;

    // minify and save js
    if (ts.js && content.js)
      this.stream.add(this.util.extend(ts.js)
        .pipe(this.minifyJs())
        .pipe(this.sourcemapsWrite(content.sourcemap||"./"))
        .dest(this.dir(content.js)));

    // save dts
    if (ts.dts && content.dts)
      this.stream.add(this.util.extend(ts.dts)
        .pipe(this.rename(content.dts))
        .dest(this.dir(content.dts)));
  }

  private buildScss(content: SCSSContent)
  {
    // log
    logVerbose("build scss "+JSON.stringify(content));

    // compile scss
    this.stream.add(this.util.src(content.src)
      .pipe(this.sourcemapsInit())
      .pipe(sass().on("error", sass.logError))
      .pipe(this.minifyCss())
      .pipe(rename(pathutil.basename(content.css)))
      .pipe(this.sourcemapsWrite(content.sourcemap||"./"))
      .dest(pathutil.dirname(content.css)));
  }
}