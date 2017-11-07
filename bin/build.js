"use strict";
exports.__esModule = true;
var linq = require("linq");
var pathutil = require("path");
var deepAssign = require("deep-assign");
var empty = require("gulp-empty");
var rename = require("gulp-rename");
var sass = require("gulp-sass");
var uglify = require("gulp-uglify");
var uglifycss = require("gulp-uglifycss");
var typescript = require("gulp-typescript");
var sourcemaps = require("gulp-sourcemaps");
var util_1 = require("./util");
var mergeStream = require("merge-stream"); // merge-stream does not support ES6 import
/** Class for building web applications. */
var WebBuild = /** @class */ (function () {
    function WebBuild(cfg) {
        this.staticContent = [];
        this.tsContent = [];
        this.scssContent = [];
        if (!cfg)
            cfg = {};
        this.util = new util_1.BuildUtil(deepAssign(this.cfg = cfg, {}));
        this.stream = mergeStream();
    }
    /** Adds content statically for copying without any building/parsing/etc. */
    WebBuild.prototype.add = function (src, dest) {
        this.staticContent.push({ src: src, dest: dest });
        return this;
    };
    /** Adds typescript content. */
    WebBuild.prototype.addTs = function (src, js, dts, sourcemap, options) {
        this.tsContent.push({
            src: src,
            js: js,
            dts: dts,
            sourcemap: sourcemap,
            options: options
        });
        return this;
    };
    /** Adds scss content. */
    WebBuild.prototype.addScss = function (src, css, sourcemap) {
        this.scssContent.push({
            src: src,
            css: this.ensureFileName(css, src, ".css"),
            sourcemap: sourcemap
        });
        return this;
    };
    /** Runs the web build. */
    WebBuild.prototype.run = function () {
        var _this = this;
        // copy static content
        if (this.staticContent.length) {
            util_1.log("copy static content");
            linq.from(this.staticContent).forEach(function (x) { return _this.copyStatic(x); });
        }
        // build ts
        if (this.tsContent.length) {
            util_1.log("build typescript");
            linq.from(this.tsContent).forEach(function (x) { return _this.buildTs(x); });
        }
        // build scss
        if (this.scssContent.length) {
            util_1.log("build scss");
            linq.from(this.scssContent).forEach(function (x) { return _this.buildScss(x); });
        }
        return this.stream;
    };
    WebBuild.prototype.copyStatic = function (content) {
        this.stream.add(this.util.copy(content.src, content.dest));
    };
    WebBuild.prototype.minifyJs = function () {
        if (this.cfg.minify)
            return uglify({});
        return empty();
    };
    WebBuild.prototype.minifyCss = function () {
        if (this.cfg.minify)
            return uglifycss({});
        return empty();
    };
    WebBuild.prototype.sourcemapsInit = function () {
        if (this.cfg.sourcemaps)
            return sourcemaps.init();
        return empty();
    };
    WebBuild.prototype.sourcemapsWrite = function (path) {
        if (this.cfg.sourcemaps)
            return sourcemaps.write(path);
        return empty();
    };
    WebBuild.prototype.ensureFileName = function (path, src, ext) {
        if (!path)
            return null;
        if (pathutil.extname(path))
            return path;
        if (path[path.length - 1] != "/")
            path += "/"; // ensure trailing /
        return path + pathutil.basename(src).replace(pathutil.extname(src), ext);
    };
    WebBuild.prototype.dir = function (path) {
        if (pathutil.extname(path))
            return pathutil.dirname(path);
        return path;
    };
    WebBuild.prototype.rename = function (path) {
        if (pathutil.extname(path))
            return rename(pathutil.basename(path));
        return empty();
    };
    WebBuild.prototype.buildTs = function (content) {
        // get config
        content.options = deepAssign({}, this.cfg.tsc, content.options);
        // set out filename
        if (pathutil.extname(content.js))
            content.options.out = pathutil.basename(content.js);
        // set declaration
        if (content.dts)
            content.options.declaration = true;
        // log
        util_1.logVerbose("build ts " + JSON.stringify(content));
        // compile ts
        var ts = this.util.src(content.src)
            .pipe(this.sourcemapsInit())
            .pipe(typescript(content.options)).stream;
        // minify and save js
        if (ts.js && content.js)
            this.stream.add(this.util.extend(ts.js)
                .pipe(this.minifyJs())
                .pipe(this.sourcemapsWrite(content.sourcemap || "./"))
                .dest(this.dir(content.js)));
        // save dts
        if (ts.dts && content.dts)
            this.stream.add(this.util.extend(ts.dts)
                .pipe(this.rename(content.dts))
                .dest(this.dir(content.dts)));
    };
    WebBuild.prototype.buildScss = function (content) {
        // log
        util_1.logVerbose("build scss " + JSON.stringify(content));
        // compile scss
        this.stream.add(this.util.src(content.src)
            .pipe(this.sourcemapsInit())
            .pipe(sass().on("error", sass.logError))
            .pipe(this.minifyCss())
            .pipe(rename(pathutil.basename(content.css)))
            .pipe(this.sourcemapsWrite(content.sourcemap || "./"))
            .dest(pathutil.dirname(content.css)));
    };
    return WebBuild;
}());
exports.WebBuild = WebBuild;
