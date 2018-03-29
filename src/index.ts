import * as sh from "shelljs";
import * as $linq from "linq";
import * as $jquery from "jquery";
import { Build } from "./build";

export { BuildConfig, BuildCallback, MergedStream, JavacOptions, SourcemapOptions, GulpTask, 
  StaticContent, TplContent, JsonContent, TSContent, SCSSContent, JavaContent, DestinationMap } from "./def"
export { BuildUtil, log, logMeta, task, runTask, series, registeredTasks, zip } from "./util";
export { Build } from "./build";
export { Clean } from "./clean";
export { VSCode, VSCodeConfig, VSCodeDebuggers } from "./vscode";
export { VSCodeTask, VSCodeTaskPresentation, VSCodeDebugger } from "./vscode-schemas";
export { Gulp as gulp } from "gulp";
export var shell=sh;
export var merge=require("deep-assign");
export var linq=$linq;
export var jquery=$jquery;
export var q=$linq.from;