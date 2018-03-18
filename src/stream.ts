import * as linq from "linq";
import * as pathutil from "path";
import * as gulp from "gulp";
import * as concat from "gulp-concat";
import * as multiDest from "gulp-multi-dest";
import * as file from "gulp-file";
import * as map from "map-stream";
import { BuildConfig, ResultMap } from "./def";
import { BuildUtil, log } from "./util";

/** Extended gulp stream. */
export class GulpStream
{
  public cfg: BuildConfig;
  public stream: NodeJS.ReadWriteStream;

  public constructor(cfg: BuildConfig, stream: NodeJS.ReadWriteStream)
  {
    this.cfg=cfg;
    this.stream=stream;
  }

  /** Return the source stream for the specified path. */
  public static src(cfg: BuildConfig, path: string|string[]): GulpStream
  {
    path=BuildUtil.getPath(path, cfg);
    log.silly("src "+JSON.stringify(path));
    return new GulpStream(cfg, gulp.src(path));
  }

  /** Return the source stream for the specified content. */
  public static contentSrc(cfg: BuildConfig, content: any): GulpStream
  {
    var str=(typeof content=="string")?content:JSON.stringify(content);
    log.silly("content src "+str);
    return new GulpStream(cfg, file("src", str, { src: true }));
  }

  /** Pipes the current stream to the specified desination stream. */
  public pipe<T extends NodeJS.WritableStream>(desination: T): GulpStream
  {
    var output=this.stream.pipe(desination);
    return new GulpStream(this.cfg, <any>output);
  }

  /** Sets the destination for the current stream. */
  public dest(path: string|string[]|ResultMap): NodeJS.ReadWriteStream
  {
    // map result?
    if (typeof path == "function")
      return this.stream.pipe(map(path));

    // get path
    path=BuildUtil.getPath(path, this.cfg);

    log.silly("dest "+JSON.stringify(path));
    var filename: string;
    if (typeof path == "string")
    {
      filename=pathutil.extname(path)?pathutil.basename(path):null;
      if (filename)
        return this.stream.pipe(concat(filename)).pipe(gulp.dest(pathutil.dirname(path)));
      return this.stream.pipe(gulp.dest(path));
    }
    else
    {
      var paths=linq.from(path).select(function (p)
      {
        if (!pathutil.extname(p))
          return p;
        filename=pathutil.basename(p);
        return pathutil.dirname(p);
      }).toArray();

      if (filename)
        return this.stream.pipe(concat(filename)).pipe(multiDest(paths));
      return this.stream.pipe(multiDest(paths));
    }
  }
}