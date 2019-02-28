import * as fs from "fs";
import * as linq from "linq";
import * as pathutil from "path";
import * as gulp from "gulp";
import * as empty from "gulp-empty";
import * as rename from "gulp-rename";
import * as data from "gulp-data";
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
import { BuildConfig, MergedStream, ReadWriteStreamExt, StaticContent, JsonContent, 
         TSContent, SCSSContent, JavaContent, JavacOptions, SourcemapOptions, TplContent, JsonFilter, BuildCallback, BuildContent, BuildContentType, FileContent } from "./def";
import { BuildUtil } from "./util";
import { merge } from "./index";
import * as log from "./log";
import { GulpStream } from "./stream";
import { TsConfig } from "gulp-typescript/release/types";
var mergeStream=require("merge-stream"); // merge-stream does not support ES6 import

/** Class for building web applications. */
export class Build
{
  public cfg: BuildConfig;
  public util: BuildUtil;
  public name: string;
  private buildContent: BuildContent[]=[];
  private vscClassPath: string[]=[];
  private classPath: string[]=[];
  private jsonVars: any;
  public vscSettings: any;

  public constructor(cfg?: BuildConfig)
  {
    if (!cfg) cfg={};
    this.init(cfg);
  }

  /** Initializes the current build. */
  private init(cfg: BuildConfig)
  {
    this.cfg=cfg;
    var clone=merge({}, cfg);
    this.util=new BuildUtil(this.cfg=merge(this.cfg, <BuildConfig> {
      // default config
      // default encoding=utf8
      prj: process.cwd(),
      minify: process.env.minify=="true" || process.argv.indexOf("--dist")>-1,
      sourcemaps: process.env.sourcemaps!="false" && process.argv.indexOf("--dist")==-1
    }, clone));

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
  public add(content: StaticContent): Build;
  public add(src: string|string[], dest: string|string[]): Build;
  public add(src: StaticContent|string|string[], dest?: string|string[]): Build
  {
    if (arguments.length==1)
      this.buildContent.push(<StaticContent>src);
    else
      this.buildContent.push(<StaticContent>{ contentType: BuildContentType.Static, src: <string|string[]>src, dest: dest });
    return this;
  }

  /** Adds static file content. */
  public addFile(content: FileContent): Build;
  public addFile(content: string|((b: Build) => string), filename: string, dest: string|string[]): Build;
  public addFile(content: any, filename?: string, dest?: string|string[]): Build
  {
    if (arguments.length==1)
      this.buildContent.push(content);
    else
      this.buildContent.push(<FileContent>{ contentType: BuildContentType.File, content: content, filename: filename, dest: dest });
    return this;
  }

  /** Adds the specified template content. */
  public addTpl(content: TplContent): Build;
  public addTpl(src: string|string[], path: string|string[], dest: string|string[], data?: any|((file: any, content: TplContent) => any)): Build;
  public addTpl(src: TplContent|string|string[], path?: string|string[], dest?: string|string[], data?: any|((file: any, content: TplContent) => any)): Build
  {
    if (arguments.length==1)
      this.buildContent.push(<TplContent>src);
    else
      this.buildContent.push(<TplContent>{ 
        contentType: BuildContentType.Tpl,
        src: <string|string[]>src, 
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
  public addJson(content: JsonContent): Build;
  public addJson(src: string|any, dest: string|any, extend?: any, base?: any, replaceVars?: boolean): Build;
  public addJson(src: JsonContent|string|any, dest?: string|any, extend?: any, base?: any, replaceVars: boolean=true): Build
  {
    if (arguments.length==1)
      this.buildContent.push(<JsonContent>src);
    else
      this.buildContent.push(<JsonContent>{ 
        contentType: BuildContentType.Json,
        src: src, 
        dest: dest, 
        extend: extend, 
        replaceVars: replaceVars 
      });
    return this;
  }

  /** Extends the config by the specified json file. */
  public config(src: string|string[]|any, filter?: string[] | JsonFilter | (string[] | JsonFilter)[], replaceVars: boolean=true): Build
  {
    if (Array.isArray(src))
    {
      var b: Build=this;
      linq.from(<string[]>src).forEach(x => 
        { 
          b=b.config(x, filter, replaceVars); 
        });
      return b;
    }

    // surround with property?
    var prop;
    if (typeof src==="string" && src.indexOf("=")>-1)
    {
      var parts=src.split("=");
      prop=parts[0];
      src=parts[1];
    }

    var content: JsonContent;
    return this.addJson(<JsonContent>(content={
      contentType: BuildContentType.Json,
      src: src,
      dest: (file) => { return this.setConfigFromFile(file, content, prop); },
      filter: filter,
      replaceVars: replaceVars
    }));
  }

  /** Adds typescript content. */
  public addTs(content: TSContent): Build;
  public addTs(src: string, js: string, dts?: string, sourcemap?: SourcemapOptions, options?: typescript.Settings): Build;
  public addTs(src: TSContent|string, js?: string, dts?: string, sourcemap?: SourcemapOptions, options?: typescript.Settings): Build
  {
    if (arguments.length==1)
      this.buildContent.push(<TSContent>src);
    else
      this.buildContent.push(<TSContent>{ 
        contentType: BuildContentType.Typescript,
        src: <string>src, 
        js: js, 
        dts: dts, 
        sourcemap: sourcemap,
        options: options 
      });
    return this;
  }

  /** Adds scss content. */
  public addScss(content: SCSSContent): Build;
  public addScss(src: string, css: string, sourcemap?: SourcemapOptions): Build;
  public addScss(src: SCSSContent|string, css?: string, sourcemap?: SourcemapOptions): Build
  {
    if (arguments.length==1)
      this.buildContent.push(<SCSSContent>src);
    else
      this.buildContent.push(<SCSSContent>{ 
        contentType: BuildContentType.Scss,
        src: <string>src, 
        css: css,
        sourcemap: sourcemap
      });
    return this;
  }

  public addJava(src: string, jar: string, classpath?: string|string[], options?: JavacOptions): Build
  {
    // resolve classpaths
    if (typeof classpath=="string") classpath=[classpath]; // ensure array
    classpath=this.resolveClassPath(classpath);

    this.buildContent.push(<JavaContent>{
      contentType: BuildContentType.Java,
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
  public resolve(path: string|string[]): string[]
  {
    return this.util.getPath(path);
  }

  /** Resolves the specified path. */
  public resolveFirst(path: string|string[]): string
  {
    return (this.util.getPath(path)||[])[0];
  }

  /** Resolves the specified data and replaces vars. */
  public resolveRecursive(data: any)
  {
    return BuildUtil.replaceVarsRecursive(data, this.cfg);
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
  public run(cb: BuildCallback): void
  {
    log.debug("Start build");
    var build=this;
    async.series(linq.from(this.buildContent)
      .select((content, idx) => 
      {
        return function (next)
        {
          var stream=build.createStream(content);
          if (stream && (!stream.isEmpty || !stream.isEmpty()))
          {
            log.debug("Start "+stream.logMsg, { debug: stream.meta });
            stream.on("finish", (err, res) => 
            {
              log.debug("Finished "+stream.logMsg, { debug: stream.meta });
              if (next) next(err, res);
              next=null;
            })
            .on("error", (err) => 
            {
              log.error(err);
              if (next) next(err);
              next=null;
            });
          }
          else
          {
            log.warn("Skipped empty stream!", stream?stream.logMsg:null);
            if (next) next(undefined, undefined);
            next=null;
          }
        };
      }).toArray(), (err) =>
      {
        log.debug("Finished build")
        if (cb) return cb(err);
      });
  }

  private createStream(content: BuildContent): ReadWriteStreamExt
  {
    switch (content.contentType)
    {
      case BuildContentType.Static: return this.copyStatic(<StaticContent>content);
      case BuildContentType.File: return this.writeFile(<FileContent>content);
      case BuildContentType.Tpl: return this.renderTpl(<TplContent>content);
      case BuildContentType.Json: return this.mergeJson(<JsonContent>content);
      case BuildContentType.Typescript: return this.buildTs(<TSContent>content);
      case BuildContentType.Scss: return this.buildScss(<SCSSContent>content);
      case BuildContentType.Java: return this.buildJava(<JavaContent>content);
    }
    return null;
  }

  private extStream(source: any, logMsg: string, content: BuildContent): ReadWriteStreamExt
  {
    if (!source)
      source={ isEmpty: function () { return true; } };
    source.logMsg=logMsg||"";
    source.meta=merge(source.meta||{}, { content: content });
    return source;
  }

  private copyStatic(content: StaticContent)
  {
    return this.extStream(this.util.copy(content.src, content.dest), "copy", content);
  }

  private writeFile(content: FileContent)
  {
    if (typeof content.content=="function")
      content.content=content.content(this);
    return this.extStream(new GulpStream(this.cfg, file(content.filename, content.content, { src: true }), { fileContent: content }).dest(content.dest), "write file", content);
  }

  private renderTpl(content: TplContent)
  {
    if (!content.data) content.data={};
    var getData=typeof content.data=="function"
      ?function (f) { return content.data(f, content); }
      :function (f){ return content.data; };
    return this.extStream(this.util.src(content.src)
      .pipe(tpldata(getData))
      .pipe(tplrender({ path: this.resolve(content.path) }))
      .dest(content.dest), "render tpl", content);
  }

  private extendSourcemapOpts(opts: SourcemapOptions, src: string, dest: string): SourcemapOptions
  {
    if (!src || !dest)
      return null;
    var srcDir=(this.util.getPath(this.dir(src)) || [])[0];
    var destDir=(this.util.getPath(this.dir(dest)) || [])[0];
    return merge(<SourcemapOptions>{
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
    if (this.cfg.sourcemaps && opt)
      return sourcemaps.init(opt);
    return empty();
  }

  private sourcemapsWrite(opt: SourcemapOptions)
  {
    if (this.cfg.sourcemaps && opt)
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

  private setConfigFromFile(file: any, content: JsonContent, prop?: string)
  {
    log.verbose("set config", content);

    // get json from file
    var jstr=String(file.contents);
    var json=JSON.parse(jstr);
    
    // wrap json into property
    if (prop)
    {
      var h={};
      h[prop]=json;
      json=h;
    }
    
    merge(this.cfg, json);
    log.verbose("config set", this.cfg);
    return file;
  }

  private filterJson(filter: string[] | JsonFilter | (string[] | JsonFilter)[])
  {
    if (filter && !Array.isArray(filter)) filter=[filter];
    if (filter && filter.length)
    {
      if (typeof filter[0]=="string") filter=[<any>filter];
      return data((file) => {
        var json=JSON.parse(String(file.contents));
        linq.from(<(string[] | JsonFilter)[]>filter).forEach(f => 
        {
          if (typeof f == "function")
            json=(<JsonFilter>f)(json);
          else // string[]
          {
            var filtered={};
            linq.from(<string[]>f).forEach(prop =>
            {
              if (prop[0]=="<")
              merge(filtered, json[prop.substr(1)]);
              else
                filtered[prop]=json[prop];
            });
            json=filtered;
          }
        });
        file.contents=new Buffer(JSON.stringify(json, null, this.cfg.minify?"":"  "));
        return json;
      });
    }
    return empty();
  }

  private getJsonVars(vars?: any): any
  {
    return merge({}, this.cfg, {
      "vscClassPath": this.vscClassPath,
      "classPath": linq.from(this.classPath).orderBy(x => x).toArray()
    }, vars);
  }

  private mergeJson(content: JsonContent)
  {
    // get source
    var src: GulpStream;
    if (typeof content.src=="function")
      content.src=content.src(this);
    if (typeof content.src=="string" || Array.isArray(content.src))
      src=this.util.src(content.src);
    else
      src=this.util.contentSrc(content.src);

    // get filename
    var fileName=pathutil.basename(typeof content.dest=="string" && pathutil.extname(content.dest) ? content.dest : (typeof content.src=="string"?content.src:"tmp.txt"));

    return this.extStream(src
      .pipe(jmerge({
        fileName: fileName,
        startObj: content.base,
        endObj: content.extend,
        jsonSpace: this.cfg.minify?"":"  ",
        jsonReplacer: content.replaceVars?(key, val) =>
        {
          if (typeof val=="string")
          {
            var list=BuildUtil.replaceVars(val, this.getJsonVars(content.vars));
            if (list.length>1)
              return list;
            return list[0];
          }
          return val;
        }:null
      }))
      .pipe(this.filterJson(content.filter))
      .dest(content.dest), "merge json", content);
  }

  private buildTs(content: TSContent)
  {
    // get config
    content.options=merge({}, this.cfg.tsc, content.options);

    // set out filename
    if (pathutil.extname(content.js))
      content.options.out=pathutil.basename(content.js); 

    // set declaration
    if (content.dts)
      content.options.declaration=true;

    // set sourcemap options
    if (content.sourcemap)
      content.sourcemap=this.extendSourcemapOpts(content.sourcemap, content.src, content.js);

    // compile ts
    var ts=<any>this.util.src(content.src)
      .pipe(this.sourcemapsInit(content.sourcemap))
      .pipe(typescript(content.options)).stream;
    var tsStream=this.extStream(ts, "build ts", content);

    // minify and save js
    if (ts && ts.js && content.js)
      this.util.extend(ts.js, ts.meta)
        .pipe(this.minifyJs())
        .pipe(this.sourcemapsWrite(content.sourcemap))
        .dest(this.dir(content.js)).on("finish", () => 
        {
          log.silly("Finished ts-js");
        });

    // save dts
    if (ts && ts.dts && content.dts)
      this.util.extend(ts.dts, ts.meta)
        .pipe(this.rename(content.dts))
        .dest(this.dir(content.dts)).on("finish", () => 
        {
          log.silly("Finished dts");
        });

    return tsStream;
  }

  private buildScss(content: SCSSContent)
  {
    // set sourcemap options
    if (content.sourcemap)
      content.sourcemap=this.extendSourcemapOpts(content.sourcemap, content.src, content.css);

    // compile scss
    return this.extStream(this.util.src(content.src)
      .pipe(this.sourcemapsInit(content.sourcemap))
      .pipe(sass().on("error", sass.logError))
      .pipe(this.minifyCss())
      .pipe(this.rename(content.css))
      .pipe(this.sourcemapsWrite(content.sourcemap))
      .dest(this.dir(content.css)), "build scss", content);
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
    content.options=merge({}, this.cfg.javac, content.options);

    // compile java
    return this.extStream(this.util.src(content.src)
      .pipe(this.javac(content.jar, content.options, content.classPath))
      .dest(pathutil.dirname(content.jar)), "build java", content);
  }
}