import * as linq from "linq";
import * as pathutil from "path";
import * as gulp from "gulp";
import * as concat from "gulp-concat";
import * as multiDest from "gulp-multi-dest";
import * as file from "gulp-file";
import * as data from "gulp-data";
import * as empty from "gulp-empty";
import { BuildConfig, DestinationMap, ReadWriteStreamExt, BuildCallback } from "./def";
import { BuildUtil } from "./util";
import { merge } from "./index";
import * as log from "./log";

/** Extended gulp stream. */
export class GulpStream
{
  public cfg: BuildConfig;
  public stream: ReadWriteStreamExt;

  public constructor(cfg: BuildConfig, stream: ReadWriteStreamExt, meta?: any)
  {
    this.cfg=cfg;
    this.stream=stream;
    if (!this.stream) log.verbose("empty src stream");
    else if (meta) this.stream.meta=merge(this.stream.meta||{}, meta);
  }

  /** Return the source stream for the specified path. */
  public static src(cfg: BuildConfig, path: string|string[]): GulpStream
  {
    path=BuildUtil.getPath(path, cfg);
    log.silly("src", path);
    return new GulpStream(cfg, path?gulp.src(path):null, { src: path });
  }

  /** Return the source stream for the specified content. */
  public static contentSrc(cfg: BuildConfig, content: any): GulpStream
  {
    var str=(typeof content=="string")?content:(content?JSON.stringify(content):null);
    log.silly("content src", str);
    return new GulpStream(cfg, str?file("src", str, { src: true }, { contentSrc: content }):null);
  }

  /** Pipes the current stream to the specified desination stream. */
  public pipe<T extends NodeJS.WritableStream>(destination: T, minify?: any): GulpStream
  {
    if (!this.stream)
      return this;
    var output=this.stream.pipe(destination);
    return new GulpStream(this.cfg, <any>output, this.stream.meta);
  }

  /** Sets the destination for the current stream. */
  public dest(path: string|string[]|DestinationMap, preDestPipe?: any): NodeJS.ReadWriteStream
  {
    if (!this.stream)
    {
      log.verbose("empty dest stream for", path);
      return null;
    }

    // destination is function?
    if (typeof path=="function")
      return this.stream.pipe(data(path));

    // get path
    path=BuildUtil.getPath(path, this.cfg);
    if (path && path.length==1)
      path=path[0];

    // add meta to src stream
    this.stream.meta=merge(this.stream.meta||{}, { dest: path });

    log.silly("dest", path);
    var filename: string;
    var destStream: ReadWriteStreamExt;
    if (typeof path == "string")
    {
      filename=pathutil.extname(path)?pathutil.basename(path):null;
      if (filename)
        destStream=this.stream.pipe(concat(filename)).pipe(preDestPipe||empty()).pipe(gulp.dest(pathutil.dirname(path)));
      else
        destStream=this.stream.pipe(preDestPipe||empty()).pipe(gulp.dest(path));
    }
    else
    {
      var paths=linq.from(<string[]>path).select(function (p: string)
      {
        if (!pathutil.extname(p))
          return p;
        filename=pathutil.basename(p);
        return pathutil.dirname(p);
      }).toArray();

      // @@todo multiDest calls finish before files are copied
      if (filename)
        destStream=this.stream.pipe(concat(filename)).pipe(preDestPipe||empty()).pipe(multiDest(paths));
      else
        destStream=this.stream.pipe(preDestPipe||empty).pipe(multiDest(paths));
    }

    // add meta to dest stream
    destStream.meta=this.stream.meta;

    // return dest stream
    return destStream;
  }
}