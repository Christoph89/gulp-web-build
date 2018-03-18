"use strict";
exports.__esModule = true;
var fs = require("fs");
var linq = require("linq");
var pathutil = require("path");
var winston = require("winston");
var gulp = require("gulp");
var gzip = require("gulp-zip");
var shell = require("shelljs");
var stripJsonComments = require("strip-json-comments");
var stream_1 = require("./stream");
var mergeStream = require("merge-stream"); // merge-stream does not support ES6 import
// log utils
var logLevel = process.env.log || process.env.LOG || "info";
exports.log = new winston.Logger({
    transports: [
        new winston.transports.Console({
            timestamp: function () { return (new Date()).toISOString(); },
            colorize: true,
            level: logLevel
        })
    ]
});
// export gulp
var tasks = [];
function task(t, dependencies, fn) {
    // get dependencies and task func
    if (!fn) {
        fn = dependencies;
        dependencies = null;
    }
    // get full task definition
    var tn = (typeof t == "string") ? {
        name: t,
        group: t == "build" || t == "dist" ? "build" : null,
        dependencies: dependencies
    } : t;
    // remember task in environment vars
    tasks.push(tn);
    process.env.regtasks = JSON.stringify(tasks);
    // register gulp task.
    return gulp.task(tn.name, tn.dependencies, function () {
        exports.log.info("[TASK " + tn.name.toUpperCase() + "]");
        return fn();
    });
}
exports.task = task;
;
/** Runs the specified task synchronously. */
function runTask(name) {
    var args = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        args[_i - 1] = arguments[_i];
    }
    shell.exec("gulp " + name + " " + args.join(" "));
}
exports.runTask = runTask;
/** Returns all registered tasks. */
function registeredTasks() {
    if (!process.env.regtasks)
        return [];
    return JSON.parse(process.env.regtasks);
}
exports.registeredTasks = registeredTasks;
/** Zips the specified source(s) to the destination zip. */
function zip(src, dest) {
    return gulp.src(src)
        .pipe(gzip(pathutil.basename(dest)))
        .pipe(gulp.dest(pathutil.dirname(dest)));
}
exports.zip = zip;
/** Contains utils for building a web application. */
var BuildUtil = /** @class */ (function () {
    /** Initializes a new instance of WebUtil. */
    function BuildUtil(cfg) {
        this.cfg = cfg;
    }
    /** Replaces all vars in the specified path and returns all replaced paths. */
    BuildUtil.prototype.getPath = function (path, vars) {
        return BuildUtil.getPath(path, vars || this.cfg);
    };
    /** Replaces all vars in the specified path and returns all replaced paths. */
    BuildUtil.getPath = function (path, vars) {
        var res = path;
        if (!res)
            return null;
        if (vars) {
            if (typeof path == "string")
                res = this.replaceVars(path, vars);
            else
                res = linq.from(path).selectMany(function (p) { return BuildUtil.getPath(p, vars); }).distinct().toArray();
        }
        if (typeof res == "string")
            return [res]; // single path string
        return res; // array
    };
    /** Replaces all occurences of the keys specified in vars with its value. */
    BuildUtil.replaceVars = function (list, vars, prefix) {
        if (prefix === void 0) { prefix = "%"; }
        if (!Array.isArray(list))
            list = [list]; // ensure array
        for (var key in vars)
            list = BuildUtil.replaceAll(list, prefix + key, vars[key]);
        return list;
    };
    BuildUtil.replaceAll = function (list, searchVal, replaceVals) {
        return linq.from(list).selectMany(function (x) { return BuildUtil.replace(x, searchVal, replaceVals); }).distinct().toArray();
    };
    BuildUtil.replace = function (str, searchVal, replaceVals) {
        if (str.indexOf(searchVal) < 0)
            return [str];
        if (!Array.isArray(replaceVals))
            replaceVals = [replaceVals];
        var res = linq.from(replaceVals).select(function (v) { return str.replace(searchVal, v); }).distinct().toArray();
        return res;
    };
    /** Reads the specified file. */
    BuildUtil.read = function (path, vars) {
        var path = (BuildUtil.getPath(path, vars) || [])[0];
        return String(fs.readFileSync(path));
    };
    /** Reads all lines from the specified file. */
    BuildUtil.readLines = function (path, vars) {
        return (BuildUtil.read(path, vars) || "").match(/[^\r\n]+/g) || [];
    };
    /** Reads the specified json file. */
    BuildUtil.readJson = function (path, vars) {
        return JSON.parse(stripJsonComments(BuildUtil.read(path, vars)));
    };
    /** Extends the specified stream. */
    BuildUtil.prototype.extend = function (stream) {
        if (stream instanceof stream_1.GulpStream)
            return stream;
        return new stream_1.GulpStream(this.cfg, stream);
    };
    /** Return the source stream for the specified path. */
    BuildUtil.prototype.src = function (path) {
        return stream_1.GulpStream.src(this.cfg, path);
    };
    /** Return the source stream for the specified content. */
    BuildUtil.prototype.contentSrc = function (content) {
        return stream_1.GulpStream.contentSrc(this.cfg, content);
    };
    /** Copies the specified source(s) to the specified desination(s). */
    BuildUtil.prototype.copy = function (source, destination) {
        exports.log.verbose("copy " + JSON.stringify(source) + " -> " + JSON.stringify(destination));
        return mergeStream(stream_1.GulpStream.src(this.cfg, source).dest(destination));
    };
    return BuildUtil;
}());
exports.BuildUtil = BuildUtil;

//# sourceMappingURL=util.js.map
