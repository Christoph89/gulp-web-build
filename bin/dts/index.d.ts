/// <reference types="jquery" />
import * as sh from "shelljs";
import * as $linq from "linq";
import * as logger from "./log";
export { BuildConfig, BuildCallback, MergedStream, JavacOptions, SourcemapOptions, GulpTask, StaticContent, TplContent, JsonContent, TSContent, SCSSContent, JavaContent, DestinationMap } from "./def";
export { BuildUtil, task, runTask, series, parallel, registeredTasks, zip } from "./util";
export { Build } from "./build";
export { Clean } from "./clean";
export { VSCode, VSCodeConfig, VSCodeDebuggers } from "./vscode";
export { VSCodeTask, VSCodeTaskPresentation, VSCodeDebugger } from "./vscode-schemas";
export { Gulp as gulp } from "gulp";
export declare var shell: typeof sh;
export declare var merge: {
    <TObject, TSource>(object: TObject, source: TSource): TObject & TSource;
    <TObject_1, TSource1, TSource2>(object: TObject_1, source1: TSource1, source2: TSource2): TObject_1 & TSource1 & TSource2;
    <TObject_2, TSource1_1, TSource2_1, TSource3>(object: TObject_2, source1: TSource1_1, source2: TSource2_1, source3: TSource3): TObject_2 & TSource1_1 & TSource2_1 & TSource3;
    <TObject_3, TSource1_2, TSource2_2, TSource3_1, TSource4>(object: TObject_3, source1: TSource1_2, source2: TSource2_2, source3: TSource3_1, source4: TSource4): TObject_3 & TSource1_2 & TSource2_2 & TSource3_1 & TSource4;
    (object: any, ...otherArgs: any[]): any;
};
export declare var linq: typeof $linq;
export declare var q: typeof $linq.from;
export declare var log: typeof logger;
export declare var jq: JQueryStatic;
