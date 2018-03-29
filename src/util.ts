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
import * as async from "async";
import * as stripJsonComments from "strip-json-comments";
import { BuildConfig, GulpTask } from "./def";
import { GulpStream } from "./stream";
import { TaskFunction } from "undertaker";

// log utils
var logLevel=process.env.log || process.env.LOG || "info";
var transport=new winston.transports.Console({
  timestamp: () => (new Date()).toISOString(),
  colorize: true,
  level: logLevel,
});
var writeLogMeta: (logLevel: string, curLevel: string, meta: any) => string;
export var log=new winston.Logger({
  transports: [transport],
  rewriters: [(lvl, msg, meta) =>
  {
    if (logLevel!="debug" && logLevel!="silly" && logLevel!="warn" && logLevel!="error" || !meta || linq.from(meta).count()==0)
      return null;
    return writeLogMeta?writeLogMeta(logLevel, lvl, meta):JSON.stringify(meta, null, "  ");
  }]
});
export function logMeta(writeMeta: (logLevel: string, curLevel: string, meta: any) => string)
{
  writeLogMeta=writeMeta;
}

// export gulp
var tasks: GulpTask[]=[];
export function task(name: string, fn: TaskFunction);
export function task(name: string, dependencies: string[], fn?: TaskFunction);
export function task(t: GulpTask, fn: TaskFunction);
export function task(t: any, dependencies: any, fn?: TaskFunction)
{
  // get dependencies and task func
  if (typeof dependencies==="function") 
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

  // set task function
  tn.fn=function (cb) {
    log.info("[TASK "+tn.name.toUpperCase()+"]");
    return fn?fn(cb):cb();
  };

  // remember task in environment vars
  tasks.push(tn);
  process.env.regtasks=JSON.stringify(tasks);

  // register gulp task series
  if (tn.dependencies && tn.dependencies.length && tn.dependencies[0]=="@series:")
    return (<any>gulp).task(tn.name, function(cb)
    {
      var funcs=linq.from(tn.dependencies).skip(1)
        .selectMany(x => getTaskFnRecursive(x)).toArray();
      funcs.push(tn.fn);
      async.series(funcs, cb);
    });

  // register normal gulp task.
  return (<any>gulp).task(tn.name, tn.dependencies, tn.fn);
};

function getTaskFnRecursive(taskName: string): TaskFunction[]
{
  var fn: TaskFunction[]=[];
  var task=getTask(taskName);
  if (task)
  {
    if (task.dependencies)
      fn=fn.concat(linq.from(task.dependencies).selectMany(x => getTaskFnRecursive(x)).toArray());
    fn.push(task.fn);
  }
  return fn;
}

/** Returns a dependency series */
export function series(...tasks: string[]): string[]
{
  return ["@series:"].concat(tasks);
}

/** Returns the specified task. */
function getTask(name: string): GulpTask
{
  return linq.from(tasks).firstOrDefault(x => x.name==name, null);
}

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
    {
      if (res=="null")
        return null;
      return [res]; // single path string
    }
    // is empty array or first entry is null or "null"
    if (Array.isArray(res))
    {
      // remove null entries
      res=linq.from(res).where(x => x!=null && x!="null").toArray();
      if (res.length==0)
        return null;
    }
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
  public extend(stream: NodeJS.ReadWriteStream, meta?: any): GulpStream
  {
    if (stream instanceof GulpStream)
      return stream;
    return new GulpStream(this.cfg, stream, meta);
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
  public copy(source: string|string[], destination: string|string[]): NodeJS.ReadWriteStream
  {
    log.silly("copy", source, destination);
    return GulpStream.src(this.cfg, source).dest(destination);
  }
}