import * as fs from "fs";
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
import * as jmerge from "gulp-merge-json";
import * as file from "gulp-file";
import * as tplrender from "gulp-nunjucks-render";
import * as tpldata from "gulp-data";
import * as async from "async"; 
import { BuildConfig, MergedStream, StaticContent, JsonContent, 
         TSContent, SCSSContent, JavaContent, JavacOptions, SourcemapOptions, TplContent, ResultMap, JsonResultMap } from "./def";
import { BuildUtil, log } from "./util";
import { GulpStream } from "./stream";
var mergeStream=require("merge-stream"); // merge-stream does not support ES6 import

/** Class for building web applications. */
export class Build
{
  public cfg: BuildConfig;
  public util: BuildUtil;
  private series: BuildSeries;
  private stream: MergedStream;
  private staticContent: StaticContent[]=[];
  private tplContent: TplContent[]=[];
  private jsonContent: JsonContent[]=[];
  private tsContent: TSContent[]=[];
  private scssContent: SCSSContent[]=[];
  private javaContent: JavaContent[]=[];
  private vscClassPath: string[]=[];
  private classPath: string[]=[];
  private jsonVars: any;
  public vscSettings: any;

  public constructor(cfg?: BuildConfig, series?: BuildSeries)
  {
    if (!cfg) cfg={};
    this.series=series || new BuildSeries();
    this.series.add(this);
    this.init(cfg);
  }

  /** Initializes the current build. */
  private init(cfg: BuildConfig)
  {
    this.util=new BuildUtil(this.cfg=deepAssign(<BuildConfig> {
      // default config
      // default encoding=utf8
      prj: process.cwd(),
      minify: process.env.minify=="true" || process.argv.indexOf("--dist")>-1,
      sourcemaps: process.env.sourcemaps!="false" && process.argv.indexOf("--dist")==-1
    }, cfg));
    this.stream=mergeStream();

    var vscodeSettings=cfg.prj?pathutil.join(cfg.prj, "./.vscode/settings.json"):null;
    if (vscodeSettings && fs.existsSync(vscodeSettings))
    {
      var vscSettings=this.vscSettings=this.readJson(vscodeSettings);
      if (vscSettings)
      {
        this.vscClassPath=this.resolveClassPath(vscSettings["java.classPath"]||[]);
        this.classPath=this.classPath.concat(this.vscClassPath);
        if (this.vscClassPath.length)
          log.info("add vs code classpath "+JSON.stringify(this.vscClassPath));
      }
    }
  }

  /** Adds content statically for copying without any building/parsing/etc. */
  public add(src: string|string[], dest: string|string[]): Build
  {
    this.staticContent.push({ src: src, dest: dest });
    return this;
  }

  /** Adds the specified template content. */
  public addTpl(src: string|string[], path: string|string[], dest: string|string[], data?: any|((file: any, content: TplContent) => any)): Build
  {
    this.tplContent.push({ 
      src: src, 
      dest: dest,
      path: path,
      data: data
    });
    return this;
  }

  /** Adds json content.
   * extend -> merges all json files and extends the merged object
   * base -> takes the base object and merges it with the specified json files
   * you can use the following vars:
   * all keys specified in build config
   * %vscClassPaths = classpaths specified in .vscode settings.json
   * %classPaths = vscClassPaths + all classpaths specified by addJava
   */
  public addJson(src: string|any, dest: string|JsonResultMap, extend?: any, base?: any, replaceVars: boolean=true): Build
  {
    this.jsonContent.push({ 
      src: src, 
      dest: dest, 
      extend: extend, 
      replaceVars: replaceVars 
    });
    return this;
  }

  /** Sets the config of the current build. */
  public setCfg(src: string|any, extend?: any, base?: any, replaceVars: boolean=true)
  {
    this.addJson(src, (json, done) => 
    {
      linq.from(this.series.builds).forEach(b => b.cfg=json);
      done(null, json);
    }, extend, base, replaceVars);
    return this.next();
  }

  /** Adds typescript content. */
  public addTs(src: string, js: string, dts?: string, sourcemap?: SourcemapOptions, options?: typescript.Settings): Build
  {
    this.tsContent.push({ 
      src: src, 
      js: js, 
      dts: dts, 
      sourcemap: this.extendSourcemapOpts(sourcemap, src, js),
      options: options 
    });
    return this;
  }

  /** Adds scss content. */
  public addScss(src: string, css: string, sourcemap?: SourcemapOptions,): Build
  {
    this.scssContent.push({ 
      src: src, 
      css: css,
      sourcemap: this.extendSourcemapOpts(sourcemap, src, css)
    });
    return this;
  }

  public addJava(src: string, jar: string, classpath?: string|string[], options?: JavacOptions): Build
  {
    // resolve classpaths
    if (typeof classpath=="string") classpath=[classpath]; // ensure array
    classpath=this.resolveClassPath(classpath);

    this.javaContent.push({
      src: src,
      jar: jar,
      classPath: this.vscClassPath.concat(classpath||[]), // concat with vsc classpaths
      options: options
    });

    // add classpath
    this.classPath.push(jar=this.resolveClassPath(jar));
    log.info("add classpath "+jar);
    if (classpath && classpath.length)
    {
      this.classPath=linq.from(this.classPath).union(linq.from(classpath)).toArray(); // remember classpaths
      log.info("add classpath "+JSON.stringify(classpath));
    }
    return this;
  }

  /** Resolve the specified path */
  public resolve(path: string): string[]
  {
    return this.util.getPath(path);
  }

  /** Resolves the specified path. */
  public resolveFirst(path: string): string
  {
    return (this.util.getPath(path)||[])[0];
  }

  /** Reads the specified file. */
  public read(path: string): string
  {
    return BuildUtil.read(path, this.cfg);
  }

  /** Reads the specified json file. */
  public readJson(path: string) : any
  {
    return BuildUtil.readJson(path, this.cfg);
  }

  /** Runs the web build. */
  public run(series_cb?: (error?: any) => void): MergedStream
  {
    // run series
    if (series_cb)
    {
      this.series.run(series_cb);
      return null;
    }

    // copy static content
    if (this.staticContent.length)
    {
      log.info("copy static content");
      linq.from(this.staticContent).forEach(x => this.copyStatic(x));
    }

    // render templates
    if (this.tplContent.length)
    {
      log.info("render template content");
      linq.from(this.tplContent).forEach(x => this.renderTpl(x));
    }

    // copy/merge json content
    if (this.jsonContent.length)
    {
      log.info("copy json content");
      linq.from(this.jsonContent).forEach(x => this.mergeJson(x, this.getJsonVars()));
    }

    // build ts
    if (this.tsContent.length)
      {
      log.info("build typescript");
      linq.from(this.tsContent).forEach(x => this.buildTs(x));
    }

    // build scss
    if (this.scssContent.length)
    {
      log.info("build scss");
      linq.from(this.scssContent).forEach(x => this.buildScss(x));
    }

    // build java
    if (this.javaContent.length)
    {
      log.info("build java");
      linq.from(this.javaContent).forEach(x => this.buildJava(x));
    }

    return this.stream;
  }

  public next(): Build
  {
    return new Build(this.cfg, this.series);
  }

  private copyStatic(content: StaticContent)
  {
    this.stream.add(this.util.copy(content.src, content.dest));
  }

  private renderTpl(content: TplContent)
  {
    if (!content.data) content.data={};
    var getData=typeof content.data=="function"
      ?function (f) { return content.data(f, content); }
      :function (f){ return content.data; };
    this.stream.add(this.util.src(content.src)
      .pipe(tpldata(getData))
      .pipe(tplrender({ path: content.path }))
      .dest(content.dest));
  }

  private extendSourcemapOpts(opts: SourcemapOptions, src: string, dest: string): SourcemapOptions
  {
    var srcDir=(this.util.getPath(this.dir(src)) || [])[0];
    var destDir=(this.util.getPath(this.dir(dest)) || [])[0];
    return deepAssign(<SourcemapOptions>{
      // default options
      includeContent: false,
      sourceRoot: pathutil.relative(destDir, srcDir),
      dest: "./"
    }, opts);
  }

  private resolveClassPath(path: string|string[])
  {
    if (typeof path=="string")
      return this.util.getPath(pathutil.join(this.cfg.prj, path))[0];
    return linq.from(<string[]>path).select(x => this.resolveClassPath(x)).toArray();
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

  private sourcemapsInit(opt: SourcemapOptions)
  {
    if (this.cfg.sourcemaps)
      return sourcemaps.init(opt);
    return empty();
  }

  private sourcemapsWrite(opt: SourcemapOptions)
  {
    if (this.cfg.sourcemaps)
      return sourcemaps.write(opt.dest, opt);
    return empty();
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

  private getJsonVars(): any
  {
    if (!this.jsonVars)
      this.jsonVars=deepAssign({}, this.cfg, {
        "vscClassPath": this.vscClassPath,
        "classPath": linq.from(this.classPath).orderBy(x => x).toArray()
      });
    return this.jsonVars;
  }

  private mergeJson(content: JsonContent, vars: any)
  {
    log.verbose("merge json "+JSON.stringify(content)+ "(vars "+JSON.stringify(vars)+")");

    // get filename
    var fileName=(typeof content.dest=="string")&&pathutil.basename(pathutil.extname(content.dest)?content.dest:content.src);

    // get result map
    if (typeof content.dest=="function")
    {
      var map=content.dest;
      content.dest=function (file, done)
      {
        var json=JSON.parse(file.contents.toString());
        map(json, done);
      };
    }

    var src: GulpStream;
    if (typeof content.src=="string" || Array.isArray(content.src))
      src=this.util.src(content.src);
    else
      src=this.util.contentSrc(content.src);
    this.stream.add(src
      .pipe(jmerge({
        fileName: fileName,
        startObj: content.base,
        endObj: content.extend,
        jsonSpace: this.cfg.minify?"":"  ",
        jsonReplacer: content.replaceVars?(key, val) =>
        {
          if (typeof val=="string")
          {
            var list=BuildUtil.replaceVars(val, vars);
            if (list.length>1)
              return list;
            return list[0];
          }
          return val;
        }:null
      }))
      .dest(content.dest));
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
    log.verbose("build ts "+JSON.stringify(content));

    // compile ts
    var ts=<any>this.util.src(content.src)
      .pipe(this.sourcemapsInit(content.sourcemap))
      .pipe(typescript(content.options)).stream;

    // minify and save js
    if (ts.js && content.js)
      this.stream.add(this.util.extend(ts.js)
        .pipe(this.minifyJs())
        .pipe(this.sourcemapsWrite(content.sourcemap))
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
    log.verbose("build scss "+JSON.stringify(content));

    // compile scss
    this.stream.add(this.util.src(content.src)
      .pipe(this.sourcemapsInit(content.sourcemap))
      .pipe(sass().on("error", sass.logError))
      .pipe(this.minifyCss())
      .pipe(this.rename(content.css))
      .pipe(this.sourcemapsWrite(content.sourcemap))
      .dest(this.dir(content.css)));
  }

  private javac(jar: string, opt: JavacOptions, libs: string|string[])
  {
    var res=javac(pathutil.basename(jar), opt);
    if (libs=this.util.getPath(libs))
      res=res.addLibraries(libs);
    return res;
  }

  private buildJava(content: JavaContent)
  {
    // get options
    content.options=deepAssign({}, this.cfg.javac, content.options);

    // log
    log.verbose("build java "+JSON.stringify(content));

    // compile java
    this.stream.add(this.util.src(content.src)
      .pipe(this.javac(content.jar, content.options, content.classPath))
      .dest(pathutil.dirname(content.jar)));
  }
}

/** Defines a build series. */
export class BuildSeries
{
  /** Initializes a new instance. */
  constructor(builds?: Build[]) {
    this.builds=builds||[];
  }

  /** The builds of the series. */
  public builds: Build[];

  /** Adds the specified build. */
  public add(build: Build)
  {
    this.builds.push(build);
  }

  /** Runs the series. */
  public run(cb: (error?: any) => void)
  {
    async.series(linq.from(this.builds||[]).select(b => 
    {
      return function (next)
      {
        b.run().on("end", next);
      };
    }).toArray(), cb);
  }
}