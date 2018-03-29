import * as del from "del";
import * as linq from "linq";
import { Build, log } from "./index";
import { MergedStream, BuildCallback } from "./def";
import { BuildUtil } from "./util";

/** Specifies utitilies to clean a project. */
export class Clean
{
  private paths: string[]=[];
  private vscSettings: any;

  /** Initializes a new instance. */
  public constructor()
  {
  }

  /** Deletes the specified paths. */
  public del(...paths: string[]): Clean
  {
    this.paths.push(...paths);
    return this;
  }

  /** Deletes all files excluded from vs code but leaves the specified paths. */
  public delVSCodeExcludes(...leave: string[]): Clean
  {
    if (!leave) leave=[];
    if (!this.vscSettings)
      this.vscSettings=BuildUtil.readJson("./.vscode/settings.json");
    var exclude: { [path: string]: boolean }=this.vscSettings?this.vscSettings["files.exclude"]:null;
    if (exclude)
      this.paths.push(...linq.from(exclude).where(x => x.value && leave.indexOf(x.key)==-1).select(x => x.key).toArray());
    return this;
  }

  /** Deletes all specified paths. */
  public run(cb: BuildCallback)
  {
    return del(this.paths, { force: true }).then(paths =>
    {
      log.info("Deleted "+(paths||[]).length+" file(s). "+JSON.stringify(paths, null, "  "));
      cb();
    });
  }
}