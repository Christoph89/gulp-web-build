import * as $ from "./src/index";

/** Installs all dependencies and prepares the project. */
$.task("prep", function prep_fn (cb) {
  return new $.VSCode()
    // exclude all paths from .gitignore
    .excludeGitIgnores("*.log")
    // exclude others
    .exclude("package-lock.json")
    // add all gulp task runners to vsc
    .addGulpTasks() 
    // add debuggers to vsc
    .addDebugger($.VSCodeDebuggers.Gulp())
    // don't forget to run
    .run(cb);
});

/** Fixes the gulp-merge-json dts file. */
$.task("fix-gulp-merge-json", function fix_fn (cb)
{
   new $.Build({})
    .add("./src/fix/gulp-merge-json.d.ts", "./node_modules/gulp-merge-json/index.d.ts")
    .run(cb);
});

/** Builds the project unminified with sourcemaps. */
$.task("build", "fix-gulp-merge-json", function build_fn (cb) {;
  return new $.Build({ minify: false, sourcemaps: true })
    .addTs("./src/*.ts", "./bin/js", "./bin/dts")
    .run(cb);
});

/** Cleans the project. */
$.task("clean", function clean_fn (cb) {
  new $.Clean()
    .delVSCodeExcludes("node_modules", "package-lock.json")
    .del("./bin")
    .run(cb);
});

/** Rebuilds the project. */
$.task("rebuild", "clean", "build");