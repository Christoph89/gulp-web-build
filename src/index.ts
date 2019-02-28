import * as sh from "shelljs";
import * as $linq from "linq";
import * as lodash from "lodash";
import * as logger from "./log";
import { Build } from "./build";

export { BuildConfig, BuildCallback, MergedStream, JavacOptions, SourcemapOptions, GulpTask, 
  StaticContent, TplContent, JsonContent, TSContent, SCSSContent, JavaContent, DestinationMap } from "./def"
export { BuildUtil, task, runTask, series, registeredTasks, zip } from "./util";
export { Build } from "./build";
export { Clean } from "./clean";
export { VSCode, VSCodeConfig, VSCodeDebuggers } from "./vscode";
export { VSCodeTask, VSCodeTaskPresentation, VSCodeDebugger } from "./vscode-schemas";
export { Gulp as gulp } from "gulp";
export var shell=sh;
export var merge=lodash.merge;
export var linq=$linq;
export var q=$linq.from;
export var log=logger;

// require jquery -> needs jsdom fix
import * as jsdom from "jsdom";
const { JSDOM } = jsdom;
const { document } = (new JSDOM("")).window;
(<any>global).document=document;
(<any>global).window=document.defaultView;
import * as $jquery from "jquery";
export var jq=$jquery;