import * as linq from "linq";
import * as pathutil from "path";
import * as gulp from "gulp";
import * as concat from "gulp-concat";
import * as multiDest from "gulp-multi-dest";
import { WebBuildConfig } from "./def";
import { BuildUtil, log, logVerbose } from "./util";

/** Extended gulp stream. */
export class GulpStream
{
  public cfg: WebBuildConfig;
  public stream: NodeJS.ReadWriteStream;

  public constructor(cfg: WebBuildConfig, stream: NodeJS.ReadWriteStream)
  {
    this.cfg=cfg;
    this.stream=stream;
  }

  /** Return the source stream for the specified path. */
  public static src(cfg: WebBuildConfig, path: string|string[]): GulpStream
  {
    path=BuildUtil.getPath(path, cfg);
    logVerbose("src "+JSON.stringify(path));
    return new GulpStream(cfg, gulp.src(path));
  }

  /** Pipes the current stream to the specified desination stream. */
  public pipe<T extends NodeJS.WritableStream>(desination: T): GulpStream
  {
    var output=this.stream.pipe(desination);
    return new GulpStream(this.cfg, <any>output);
  }

  /** Sets the destination for the current stream. */
  public dest(path: string|string[]): NodeJS.ReadWriteStream
  {
    // get path
    path=BuildUtil.getPath(path, this.cfg);

    logVerbose("dest "+JSON.stringify(path));
    var filename: string;
    if (typeof path == "string")
    {
      filename=pathutil.extname(path)?pathutil.basename(path):null;
      if (filename)
        return this.stream.pipe(concat(filename)).pipe(gulp.dest(pathutil.dirname(path)));
      this.stream.pipe(gulp.dest(path));
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