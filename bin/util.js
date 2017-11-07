"use strict";
exports.__esModule = true;
var linq = require("linq");
var del = require("del");
var winston = require("winston");
var gulp = require("gulp");
var stream_1 = require("./stream");
var mergeStream = require("merge-stream"); // merge-stream does not support ES6 import
// log utils
var logger = new winston.Logger({
    transports: [
        new winston.transports.Console({
            timestamp: function () { return (new Date()).toISOString(); },
            colorize: true,
            level: process.env.verbose == "true" ? "verbose" : "info"
        })
    ]
});
function log(msg) { logger.info(msg); }
exports.log = log;
function logVerbose(msg) { logger.verbose(msg); }
exports.logVerbose = logVerbose;
function task(name, dependencies, fn) {
    if (!fn) {
        fn = dependencies;
        dependencies = null;
    }
    return gulp.task(name, dependencies, function () {
        log("[TASK " + name.toUpperCase() + "]");
        return fn();
    });
}
exports.task = task;
;
// export del
function clean(paths) {
    return del(paths, { force: true }).then(function (paths) {
        log("Deleted " + (paths || []).length + " file(s). " + JSON.stringify(paths, null, "  "));
    });
}
exports.clean = clean;
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
        var res;
        if (!path)
            return null;
        if (!vars)
            return path;
        if (typeof path == "string")
            res = this.replaceVars(path, vars);
        else
            res = linq.from(path).selectMany(function (p) { return BuildUtil.getPath(p, vars); }).distinct().toArray();
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
    /** Copies the specified source(s) to the specified desination(s). */
    BuildUtil.prototype.copy = function (source, destination) {
        logVerbose("copy " + JSON.stringify(source) + " -> " + JSON.stringify(destination));
        return mergeStream(stream_1.GulpStream.src(this.cfg, source).dest(destination));
    };
    return BuildUtil;
}());
exports.BuildUtil = BuildUtil;
