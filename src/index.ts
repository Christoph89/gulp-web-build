import * as sh from "shelljs";
import * as $linq from "linq";
import { Build } from "./build";

export { BuildConfig, MergedStream, JavacOptions, SourcemapOptions, GulpTask } from "./def"
export { BuildUtil, log, task, runTask, registeredTasks, zip } from "./util";
export { Build } from "./build";
export { Clean } from "./clean";
export { VSCode, VSCodeConfig, VSCodeDebuggers } from "./vscode";
export { VSCodeTask, VSCodeTaskPresentation, VSCodeDebugger } from "./vscode-schemas";
export { Gulp as gulp } from "gulp";
export var shell=sh;
export var merge=require("deep-assign");
export var linq=$linq;
export var q=$linq.from;