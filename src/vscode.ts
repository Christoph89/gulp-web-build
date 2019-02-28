import * as fs from "fs";
import * as linq from "linq";
import * as pathutil from "path";
import * as stripJsonComments from "strip-json-comments";
import { Build, log, registeredTasks, merge } from "./index";
import { VSCodeTask, VSCodeDebugger } from "./vscode-schemas";
import { MergedStream, GulpTask, BuildCallback } from "./def";
import { BuildUtil } from "./util";

/** Specifies the config for vs code. */
export interface VSCodeConfig
{
  /** Specifies the project directory. */
  prj?: string;
}


/** Initializer for vs code projects. */
export class VSCode
{
  private cfg: VSCodeConfig;
  private build: Build;
  private debuggers: VSCodeDebugger[]=[];
  private tasks: VSCodeTask[]=[];
  private settings: any={};

  public static launchJsonVersion="0.2.0";
  public static tasksJsonVersion="2.0.0";

  /** Initializes a new instance. */
  public constructor(cfg?: VSCodeConfig)
  {
    this.cfg=merge({
      // default config
      prj: process.cwd()
    }, cfg);

    // init build
    this.build=new Build({ prj: this.cfg.prj });
  }

  /** Adds a debugger. */
  public addDebugger(...dbg: (VSCodeDebugger|VSCodeDebugger[])[]): VSCode
  {
    this.debuggers.push(...linq.from(dbg).selectMany(x => Array.isArray(x)?x:[x]).toArray());
    return this;
  }

  /** Add a task. */
  public addTask(...task: VSCodeTask[]): VSCode
  {
    this.tasks.push(...task);
    return this;
  }

  /** Adds all gulp tasks. */
  public addGulpTasks(...tasks: (string|GulpTask)[]): VSCode
  {
    // use passed or get registered tasks
    if (!tasks || !tasks.length)
      tasks=registeredTasks();
    else if (tasks.length && (typeof tasks[0]=="string"))
      tasks=linq.from(tasks).select(x => <GulpTask>{ name: x }).toArray(); // convert string array

    linq.from(<GulpTask[]>tasks).forEach(t => this.addTask({
      label: t.name,
      command: "gulp",
      type: "shell",
      args: [t.name].concat(...(t.args||[])),
      group: t.group||"none",
      presentation:
      {
        reveal: "always",
        panel: "new"
      },
      problemMatcher: []
    }));
    return this;
  } 

  /** Adds the specified java dependencies to settings.json. */
  public addJavaClasspath(...dependencies: string[]): VSCode
  {
    if (!this.settings["java.classPath"])
      this.settings["java.classPath"]=[];
    this.settings["java.classPath"].push(...dependencies);
    return this;
  }

  /** Adds all java dependencies specified at the javaDependencies property in package.json  */
  public addNpmJavaDepdencies(): VSCode
  {
    var pkg=this.build.readJson("%prj/package.json");
    
    // read java dependencies from package.json javaDependencies property
    if (pkg.javaDependencies)
      linq.from(<string[]>pkg.javaDependencies).forEach(x =>
      {
        var resolved=this.resolveNpmJavaDependency(x);
        if (resolved)
          this.addJavaClasspath(...resolved);
      });
    return this;
  }

  /** Resolves the specified java dependency. */
  public resolveNpmJavaDependency(dependency: string): string[]
  {
    var prj=this.build.resolveFirst("%prj/");

    // is local dependency path?
    var h=dependency[0];
    if (h=="." || h=="/" || h=="\\" || h=="~")
      return [dependency];
    
    // else npm dependency
    var dir=prj+"node_modules/"+dependency+"/";
    var pkg=this.build.readJson(dir+"package.json");  
    
    if (!pkg.java)
      return null;

    // read jars from package.json java property
    var paths: string[]=Array.isArray(pkg.java)?pkg.java:[pkg.java];
    return linq.from(paths).select(x => pathutil.relative(prj, pathutil.join(dir, x))).toArray();
  }

  /** Excludes the specified paths from vs code. */
  public exclude(...paths: (string|string[])[]): VSCode
  {
    var fx: { [file: string]: boolean }=this.settings["files.exclude"];
    if (!fx)
      fx={};
    linq.from(paths).selectMany(p => Array.isArray(p)?p:[p]).forEach(p => {
      linq.from(this.build.resolve(p)).forEach(x => {
        fx[x]=true;
      });
    });
    this.settings["files.exclude"]=fx;
    return this;
  }

  /** Excludes all paths from .gitignore from vs code.*/
  public excludeGitIgnores(...except: string[]): VSCode
  {
    if (!fs.existsSync(".gitignore"))
      return this;
    var exc=except?linq.from(except):null;
    var paths=linq.from(BuildUtil.readLines(".gitignore")).where(l => 
    {
      var trimmed=l.trim();
      if (exc && exc.contains(trimmed))
        return false;
      return trimmed!=".vscode" && trimmed[0]!="#" // do not exclude .vscode and gitignore comments
    }).toArray();
    this.exclude(...paths);
    return this;
  }

  public run(cb: BuildCallback)
  {
    // add launch.json
    if (this.debuggers.length)
    {
      log.info("add debuggers to .vscode/launch.json");
      this.build.addJson({
        version: VSCode.launchJsonVersion,
        configurations: this.debuggers
      }, "%prj/.vscode/launch.json");
    }

    // add tasks.json
    if (this.tasks.length)
    {
      log.info("add tasks to .vscode/tasks.json");
      this.build.addJson({
        version: VSCode.tasksJsonVersion,
        tasks: this.tasks
      }, "%prj/.vscode/tasks.json");
    }

    // add settings.json
    if (this.settings && linq.from(this.settings).count()>0)
    {
      log.info("add settings.json");
      var path=this.build.resolveFirst("%prj/.vscode/settings.json");
      this.build.addJson({}, path, this.settings);
    }

    // run
    return this.build.run(cb);
  }
}

/** Contains debuggers. */
export module VSCodeDebuggers
{
  /** Gulp build debugger.
   * @param buildTask Specifies the build task. default=build
   */
  export function Gulp(...tasks: string[]): VSCodeDebugger[]
  {
    if (!tasks || !tasks.length)
      tasks=linq.from(registeredTasks()).select(x => x.name).toArray();
    return linq.from(tasks).select(task => Node("Gulp "+task, "node_modules/gulp/bin/gulp.js", [task])).toArray();
  }

  /** Node debugger.
   * @param name Name of the debugger
   * @param js Path to your node js file relative to your workspace root.
   * @param env Environment variables.
   * @param args Command line args.
   */
  export function Node(name: string, js: string, args?: string[], env?: any): VSCodeDebugger
  {
    // merge environment vars
    env=merge({}, {
      "TS_NODE_CACHE_DIRECTORY": "${workspaceRoot}/.node",
      "LOG": "debug"
    }, env);

    return {
      type: "node",
      request: "launch",
      name: name,
      program: "${workspaceRoot}/"+js,
      args: args,
      cwd: "${workspaceRoot}",
      sourceMaps: true,
      outFiles: [ "${workspaceRoot}/.node" ],
      env: env,
      protocol: "inspector",
      console: "integratedTerminal"
    };
  }

  /** Node web application debugger.
   * @param bin Specifies the bin folder. default=${workspaceRoot}/bin
   * @param start Specifies the start js file relative to bin. default=www.js
   */
  export function NodeWebApplication(bin: string="${workspaceRoot}/bin", start: string="www.js") : VSCodeDebugger
  {
    return {
      type: "node",
      request: "launch",
      name: "Run web application",
      program: bin+"/www.js",
      cwd: "${workspaceRoot}",
      sourceMaps: true,
      outFiles: [ bin+"/**/*.js" ],
      env: {
        "DEBUG": "express:*"
      },
      protocol: "inspector",
      console: "integratedTerminal"
    };
  }
}