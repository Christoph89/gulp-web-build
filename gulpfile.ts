import * as $ from "./src/index";

// build task
$.task("build", function () {
  return new $.WebBuild()
    .addTs("./src/*.ts", "./bin", "./types")
    .run();
});

// clean task
$.task("clean", function () {
  return $.clean(["./bin", "./types"]);
});