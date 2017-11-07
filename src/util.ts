import * as linq from "linq";
import * as del from "del";
import * as deepAssign from "deep-assign";
import * as winston from "winston";
import * as gulp from "gulp";
import * as multiDest from "gulp-multi-dest";
import { WebBuildConfig } from "./def";
import { GulpStream } from "./stream";
var mergeStream=require("merge-stream"); // merge-stream does not support ES6 import

// log utils
var logger=new winston.Logger({
  transports: [
    new winston.transports.Console({
      timestamp: () => (new Date()).toISOString(),
      colorize: true,
      level: process.env.verbose=="true"?"verbose":"info",
    })
  ]
});
export function log(msg: string) { logger.info(msg); }
export function logVerbose(msg: string) { logger.verbose(msg); }

// export gulp
export function task(name: string, fn: () => void);
export function task (name: string, dependencies: string[], fn: () => void);
export function task(name: string, dependencies: any, fn?: () => void)
{
  if (!fn) 
  {
    fn=dependencies;
    dependencies=null;
  }
  return (<any>gulp).task(name, dependencies, function()
  {
    log("[TASK "+name.toUpperCase()+"]");
    return fn();
  });
};

// export del
export function clean(paths: string|string[])
{
  return del(paths, { force: true }).then(paths =>
  {
    log("Deleted "+(paths||[]).length+" file(s). "+JSON.stringify(paths, null, "  "));
  });
}

/** Contains utils for building a web application. */
export class BuildUtil
{
  public cfg: WebBuildConfig

  /** Initializes a new instance of WebUtil. */
  public constructor(cfg: WebBuildConfig)
  {
    this.cfg=cfg;
  }

   /** Replaces all vars in the specified path and returns all replaced paths. */
  public getPath(path: string|string[], vars?: any): string|string[]
  {
    return BuildUtil.getPath(path, vars||this.cfg);
  } 

  /** Replaces all vars in the specified path and returns all replaced paths. */
  public static getPath(path: string|string[], vars: any): string|string[]
  {
    var res;
    if (!path) return null;
    if (!vars) return path;
    if (typeof path == "string")
      res=this.replaceVars(path, vars);
    else
      res=linq.from((<string[]>path)).selectMany(p => { return BuildUtil.getPath(p, vars); }).distinct().toArray();

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

  /** Copies the specified source(s) to the specified desination(s). */
  public copy(source: string|string[], destination: string|string[])
  {
    logVerbose("copy "+JSON.stringify(source)+" -> "+JSON.stringify(destination));
    return mergeStream(GulpStream.src(this.cfg, source).dest(destination));
  }
}