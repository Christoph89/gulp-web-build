"use strict";
exports.__esModule = true;
var sh = require("shelljs");
var $linq = require("linq");
var lodash = require("lodash");
var logger = require("./log");
var util_1 = require("./util");
exports.BuildUtil = util_1.BuildUtil;
exports.task = util_1.task;
exports.runTask = util_1.runTask;
exports.series = util_1.series;
exports.parallel = util_1.parallel;
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
exports.merge = lodash.merge;
exports.linq = $linq;
exports.q = $linq.from;
exports.log = logger;
// require jquery -> needs jsdom fix
var jsdom = require("jsdom");
var JSDOM = jsdom.JSDOM;
var document = (new JSDOM("")).window.document;
global.document = document;
global.window = document.defaultView;
var $jquery = require("jquery");
exports.jq = $jquery;
