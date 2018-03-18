"use strict";
exports.__esModule = true;
var sh = require("shelljs");
var $linq = require("linq");
var util_1 = require("./util");
exports.BuildUtil = util_1.BuildUtil;
exports.log = util_1.log;
exports.task = util_1.task;
exports.runTask = util_1.runTask;
exports.registeredTasks = util_1.registeredTasks;
exports.zip = util_1.zip;
var build_1 = require("./build");
exports.Build = build_1.Build;
var clean_1 = require("./clean");
exports.Clean = clean_1.Clean;
var vscode_1 = require("./vscode");
exports.VSCode = vscode_1.VSCode;
exports.VSCodeDebuggers = vscode_1.VSCodeDebuggers;
exports.shell = sh;
exports.merge = require("deep-assign");
exports.linq = $linq;
exports.q = $linq.from;

//# sourceMappingURL=index.js.map