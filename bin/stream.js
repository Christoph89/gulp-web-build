"use strict";
exports.__esModule = true;
var linq = require("linq");
var pathutil = require("path");
var gulp = require("gulp");
var concat = require("gulp-concat");
var multiDest = require("gulp-multi-dest");
var util_1 = require("./util");
/** Extended gulp stream. */
var GulpStream = /** @class */ (function () {
    function GulpStream(cfg, stream) {
        this.cfg = cfg;
        this.stream = stream;
    }
    /** Return the source stream for the specified path. */
    GulpStream.src = function (cfg, path) {
        path = util_1.BuildUtil.getPath(path, cfg);
        util_1.logVerbose("src " + JSON.stringify(path));
        return new GulpStream(cfg, gulp.src(path));
    };
    /** Pipes the current stream to the specified desination stream. */
    GulpStream.prototype.pipe = function (desination) {
        var output = this.stream.pipe(desination);
        return new GulpStream(this.cfg, output);
    };
    /** Sets the destination for the current stream. */
    GulpStream.prototype.dest = function (path) {
        // get path
        path = util_1.BuildUtil.getPath(path, this.cfg);
        util_1.logVerbose("dest " + JSON.stringify(path));
        var filename;
        if (typeof path == "string") {
            filename = pathutil.extname(path) ? pathutil.basename(path) : null;
            if (filename)
                return this.stream.pipe(concat(filename)).pipe(gulp.dest(pathutil.dirname(path)));
            this.stream.pipe(gulp.dest(path));
        }
        else {
            var paths = linq.from(path).select(function (p) {
                if (!pathutil.extname(p))
                    return p;
                filename = pathutil.basename(p);
                return pathutil.dirname(p);
            }).toArray();
            if (filename)
                return this.stream.pipe(concat(filename)).pipe(multiDest(paths));
            return this.stream.pipe(multiDest(paths));
        }
    };
    return GulpStream;
}());
exports.GulpStream = GulpStream;
