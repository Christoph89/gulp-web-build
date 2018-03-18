import * as fs from "fs";
import * as linq from "linq";
import * as del from "del";
import * as pathutil from "path";
import * as deepAssign from "deep-assign";
import * as winston from "winston";
import * as gulp from "gulp";
import * as multiDest from "gulp-multi-dest";
import * as gzip from "gulp-zip";
import * as shell from "shelljs";
import * as stripJsonComments from "strip-json-comments";
import { BuildConfig, GulpTask } from "./def";
import { GulpStream } from "./stream";
import { TaskFunction } from "undertaker";
var mergeStream=require("merge-stream"); // merge-stream does not support ES6 import

// log utils
var logLevel=process.env.log || process.env.LOG || "info";
export var log=new winston.Logger({
  transports: [
    new winston.transports.Console({
      timestamp: () => (new Date()).toISOString(),
      colorize: true,
      level: logLevel,
    })
  ]
});

// export gulp
var tasks: GulpTask[]=[];
export function task(name: string, fn: TaskFunction);
export function task (name: string, dependencies: string[], fn: TaskFunction);
export function task(t: GulpTask, fn: TaskFunction);
export function task(t: any, dependencies: any, fn?: TaskFunction)
{
  // get dependencies and task func
  if (!fn) 
  {
    fn=dependencies;
    dependencies=null;
  }

  // get full task definition
  var tn: GulpTask=(typeof t=="string")?{ 
    name: t, 
    group: t=="build"||t=="dist"?"build":null, // register build and dist task automatically as build task
    dependencies: dependencies 
  }:t;

  // remember task in environment vars
  tasks.push(tn);
  process.env.regtasks=JSON.stringify(tasks);

  // register gulp task.
  return (<any>gulp).task(tn.name, tn.dependencies, function(cb)
  {
    log.info("[TASK "+tn.name.toUpperCase()+"]");
    return fn(cb);
  });
};

/** Runs the specified task synchronously. */
export function runTask(name: string, ...args: string[])
{
  shell.exec("gulp "+name+" "+args.join(" "));
}

/** Returns all registered tasks. */
export function registeredTasks(): GulpTask[]
{
  if (!process.env.regtasks)
    return [];
  return JSON.parse(process.env.regtasks);
}

/** Zips the specified source(s) to the destination zip. */
export function zip(src: string|string[], dest: string)
{
  return gulp.src(src)
    .pipe(gzip(pathutil.basename(dest)))
    .pipe(gulp.dest(pathutil.dirname(dest)));
}

/** Contains utils for building a web application. */
export class BuildUtil
{
  public cfg: BuildConfig

  /** Initializes a new instance of WebUtil. */
  public constructor(cfg: BuildConfig)
  {
    this.cfg=cfg;
  }

   /** Replaces all vars in the specified path and returns all replaced paths. */
  public getPath(path: string|string[], vars?: any): string[]
  {
    return BuildUtil.getPath(path, vars||this.cfg);
  } 

  /** Replaces all vars in the specified path and returns all replaced paths. */
  public static getPath(path: string|string[], vars: any): string[]
  {
    var res=path;
    if (!res) return null;

    if (vars)
    {
      if (typeof path == "string")
        res=this.replaceVars(path, vars);
      else
        res=linq.from((<string[]>path)).selectMany(p => { return BuildUtil.getPath(p, vars); }).distinct().toArray();
    }

    if (typeof res == "string")
      return [res]; // single path string
    return res; // array
  }

  /** Replaces all occurences of the keys specified in vars with its value. */
  public static replaceVars(list: string|string[], vars: any, prefix: string="%"): string[]
  {
    if (!Array.isArray(list)) list=[list]; // ensure array
    for (var key in vars)
      list=BuildUtil.replaceAll(<string[]>list, prefix+key, vars[key]);
    return list;
  }

  private static replaceAll(list: string[], searchVal: string, replaceVals: string|string[]): string[]
  {
    return linq.from(list).selectMany(x => BuildUtil.replace(x, searchVal, replaceVals)).distinct().toArray();
  }

  private static replace(str: string, searchVal: string, replaceVals: string|string[]): string[]
  {
    if (str.indexOf(searchVal)<0)
      return [str];
    if (!Array.isArray(replaceVals)) replaceVals=[replaceVals];
    var res=linq.from(replaceVals).select(v => str.replace(searchVal, v)).distinct().toArray();
    return res;
  }

  /** Reads the specified file. */
  public static read(path: string, vars?: any): string
  {
    var path=(BuildUtil.getPath(path, vars)||[])[0];
    return String(fs.readFileSync(path));
  }

  /** Reads all lines from the specified file. */
  public static readLines(path: string, vars?: any): string[]
  {
    return (BuildUtil.read(path, vars)||"").match(/[^\r\n]+/g) || [];
  }

  /** Reads the specified json file. */
  public static readJson(path: string, vars?: any) : any
  {
    return JSON.parse(stripJsonComments(BuildUtil.read(path, vars)));
  }

  /** Extends the specified stream. */
  public extend(stream: NodeJS.ReadWriteStream): GulpStream
  {
    if (stream instanceof GulpStream)
      return stream;
    return new GulpStream(this.cfg, stream);
  }

  /** Return the source stream for the specified path. */
  public src(path: string|string[]): GulpStream
  {
    return GulpStream.src(this.cfg, path);
  }

  /** Return the source stream for the specified content. */
  public contentSrc(content: any): GulpStream
  {
    return GulpStream.contentSrc(this.cfg, content);
  }

  /** Copies the specified source(s) to the specified desination(s). */
  public copy(source: string|string[], destination: string|string[])
  {
    log.verbose("copy "+JSON.stringify(source)+" -> "+JSON.stringify(destination));
    return mergeStream(GulpStream.src(this.cfg, source).dest(destination));
  }
}