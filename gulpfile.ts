import * as $ from "./src/index";

/** Installs all dependencies and prepares the project. */
$.task("prep", function () {
  return new $.VSCode()
    // exclude all paths from .gitignore
    .excludeGitIgnores()
    // add all gulp task runners to vsc
    .addGulpTasks() 
    // add debuggers to vsc
    .addDebugger($.VSCodeDebuggers.Gulp())
    // don't forget to run
    .run();
});

/** Fixes the gulp-merge-json dts file. */
$.task("fix-gulp-merge-json", function ()
{
  return new $.Build({})
    .add("./src/fix/gulp-merge-json.d.ts", "./node_modules/gulp-merge-json/index.d.ts")
    .run();
});

/** Builds the project unminified with sourcemaps. */
$.task("build", ["fix-gulp-merge-json"], function () {;
  return new $.Build({ minify: false, sourcemaps: true })
    .addTs("./src/*.ts", "./bin/js", "./bin/dts")
    .run();
});

/** Cleans the project. */
$.task("clean", function () {
  return new $.Clean()
    .delVSCodeExcludes("node_modules")
    .run();
});