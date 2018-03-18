"use strict";
exports.__esModule = true;
var fs = require("fs");
var linq = require("linq");
var pathutil = require("path");
var deepAssign = require("deep-assign");
var empty = require("gulp-empty");
var rename = require("gulp-rename");
var sass = require("gulp-sass");
var javac = require("gulp-javac");
var uglify = require("gulp-uglify");
var uglifycss = require("gulp-uglifycss");
var typescript = require("gulp-typescript");
var sourcemaps = require("gulp-sourcemaps");
var jmerge = require("gulp-merge-json");
var tplrender = require("gulp-nunjucks-render");
var tpldata = require("gulp-data");
var async = require("async");
var util_1 = require("./util");
var mergeStream = require("merge-stream"); // merge-stream does not support ES6 import
/** Class for building web applications. */
var Build = /** @class */ (function () {
    function Build(cfg, series) {
        this.staticContent = [];
        this.tplContent = [];
        this.jsonContent = [];
        this.tsContent = [];
        this.scssContent = [];
        this.javaContent = [];
        this.vscClassPath = [];
        this.classPath = [];
        if (!cfg)
            cfg = {};
        this.series = series || new BuildSeries();
        this.series.add(this);
        this.init(cfg);
    }
    /** Initializes the current build. */
    Build.prototype.init = function (cfg) {
        this.util = new util_1.BuildUtil(this.cfg = deepAssign({
            // default config
            // default encoding=utf8
            prj: process.cwd(),
            minify: process.env.minify == "true" || process.argv.indexOf("--dist") > -1,
            sourcemaps: process.env.sourcemaps != "false" && process.argv.indexOf("--dist") == -1
        }, cfg));
        this.stream = mergeStream();
        var vscodeSettings = cfg.prj ? pathutil.join(cfg.prj, "./.vscode/settings.json") : null;
        if (vscodeSettings && fs.existsSync(vscodeSettings)) {
            var vscSettings = this.vscSettings = this.readJson(vscodeSettings);
            if (vscSettings) {
                this.vscClassPath = this.resolveClassPath(vscSettings["java.classPath"] || []);
                this.classPath = this.classPath.concat(this.vscClassPath);
                if (this.vscClassPath.length)
                    util_1.log.info("add vs code classpath " + JSON.stringify(this.vscClassPath));
            }
        }
    };
    /** Adds content statically for copying without any building/parsing/etc. */
    Build.prototype.add = function (src, dest) {
        this.staticContent.push({ src: src, dest: dest });
        return this;
    };
    /** Adds the specified template content. */
    Build.prototype.addTpl = function (src, path, dest, data) {
        this.tplContent.push({
            src: src,
            dest: dest,
            path: path,
            data: data
        });
        return this;
    };
    /** Adds json content.
     * extend -> merges all json files and extends the merged object
     * base -> takes the base object and merges it with the specified json files
     * you can use the following vars:
     * all keys specified in build config
     * %vscClassPaths = classpaths specified in .vscode settings.json
     * %classPaths = vscClassPaths + all classpaths specified by addJava
     */
    Build.prototype.addJson = function (src, dest, extend, base, replaceVars) {
        if (replaceVars === void 0) { replaceVars = true; }
        this.jsonContent.push({
            src: src,
            dest: dest,
            extend: extend,
            replaceVars: replaceVars
        });
        return this;
    };
    /** Sets the config of the current build. */
    Build.prototype.setCfg = function (src, extend, base, replaceVars) {
        var _this = this;
        if (replaceVars === void 0) { replaceVars = true; }
        this.addJson(src, function (json, done) {
            linq.from(_this.series.builds).forEach(function (b) { return b.cfg = json; });
            done(null, json);
        }, extend, base, replaceVars);
        return this.next();
    };
    /** Adds typescript content. */
    Build.prototype.addTs = function (src, js, dts, sourcemap, options) {
        this.tsContent.push({
            src: src,
            js: js,
            dts: dts,
            sourcemap: this.extendSourcemapOpts(sourcemap, src, js),
            options: options
        });
        return this;
    };
    /** Adds scss content. */
    Build.prototype.addScss = function (src, css, sourcemap) {
        this.scssContent.push({
            src: src,
            css: css,
            sourcemap: this.extendSourcemapOpts(sourcemap, src, css)
        });
        return this;
    };
    Build.prototype.addJava = function (src, jar, classpath, options) {
        // resolve classpaths
        if (typeof classpath == "string")
            classpath = [classpath]; // ensure array
        classpath = this.resolveClassPath(classpath);
        this.javaContent.push({
            src: src,
            jar: jar,
            classPath: this.vscClassPath.concat(classpath || []),
            options: options
        });
        // add classpath
        this.classPath.push(jar = this.resolveClassPath(jar));
        util_1.log.info("add classpath " + jar);
        if (classpath && classpath.length) {
            this.classPath = linq.from(this.classPath).union(linq.from(classpath)).toArray(); // remember classpaths
            util_1.log.info("add classpath " + JSON.stringify(classpath));
        }
        return this;
    };
    /** Resolve the specified path */
    Build.prototype.resolve = function (path) {
        return this.util.getPath(path);
    };
    /** Resolves the specified path. */
    Build.prototype.resolveFirst = function (path) {
        return (this.util.getPath(path) || [])[0];
    };
    /** Reads the specified file. */
    Build.prototype.read = function (path) {
        return util_1.BuildUtil.read(path, this.cfg);
    };
    /** Reads the specified json file. */
    Build.prototype.readJson = function (path) {
        return util_1.BuildUtil.readJson(path, this.cfg);
    };
    /** Runs the web build. */
    Build.prototype.run = function (series_cb) {
        var _this = this;
        // run series
        if (series_cb) {
            this.series.run(series_cb);
            return null;
        }
        // copy static content
        if (this.staticContent.length) {
            util_1.log.info("copy static content");
            linq.from(this.staticContent).forEach(function (x) { return _this.copyStatic(x); });
        }
        // render templates
        if (this.tplContent.length) {
            util_1.log.info("render template content");
            linq.from(this.tplContent).forEach(function (x) { return _this.renderTpl(x); });
        }
        // copy/merge json content
        if (this.jsonContent.length) {
            util_1.log.info("copy json content");
            linq.from(this.jsonContent).forEach(function (x) { return _this.mergeJson(x, _this.getJsonVars()); });
        }
        // build ts
        if (this.tsContent.length) {
            util_1.log.info("build typescript");
            linq.from(this.tsContent).forEach(function (x) { return _this.buildTs(x); });
        }
        // build scss
        if (this.scssContent.length) {
            util_1.log.info("build scss");
            linq.from(this.scssContent).forEach(function (x) { return _this.buildScss(x); });
        }
        // build java
        if (this.javaContent.length) {
            util_1.log.info("build java");
            linq.from(this.javaContent).forEach(function (x) { return _this.buildJava(x); });
        }
        return this.stream;
    };
    Build.prototype.next = function () {
        return new Build(this.cfg, this.series);
    };
    Build.prototype.copyStatic = function (content) {
        this.stream.add(this.util.copy(content.src, content.dest));
    };
    Build.prototype.renderTpl = function (content) {
        if (!content.data)
            content.data = {};
        var getData = typeof content.data == "function"
            ? function (f) { return content.data(f, content); }
            : function (f) { return content.data; };
        this.stream.add(this.util.src(content.src)
            .pipe(tpldata(getData))
            .pipe(tplrender({ path: content.path }))
            .dest(content.dest));
    };
    Build.prototype.extendSourcemapOpts = function (opts, src, dest) {
        var srcDir = (this.util.getPath(this.dir(src)) || [])[0];
        var destDir = (this.util.getPath(this.dir(dest)) || [])[0];
        return deepAssign({
            // default options
            includeContent: false,
            sourceRoot: pathutil.relative(destDir, srcDir),
            dest: "./"
        }, opts);
    };
    Build.prototype.resolveClassPath = function (path) {
        var _this = this;
        if (typeof path == "string")
            return this.util.getPath(pathutil.join(this.cfg.prj, path))[0];
        return linq.from(path).select(function (x) { return _this.resolveClassPath(x); }).toArray();
    };
    Build.prototype.minifyJs = function () {
        if (this.cfg.minify)
            return uglify({});
        return empty();
    };
    Build.prototype.minifyCss = function () {
        if (this.cfg.minify)
            return uglifycss({});
        return empty();
    };
    Build.prototype.sourcemapsInit = function (opt) {
        if (this.cfg.sourcemaps)
            return sourcemaps.init(opt);
        return empty();
    };
    Build.prototype.sourcemapsWrite = function (opt) {
        if (this.cfg.sourcemaps)
            return sourcemaps.write(opt.dest, opt);
        return empty();
    };
    Build.prototype.dir = function (path) {
        if (pathutil.extname(path))
            return pathutil.dirname(path);
        return path;
    };
    Build.prototype.rename = function (path) {
        if (pathutil.extname(path))
            return rename(pathutil.basename(path));
        return empty();
    };
    Build.prototype.getJsonVars = function () {
        if (!this.jsonVars)
            this.jsonVars = deepAssign({}, this.cfg, {
                "vscClassPath": this.vscClassPath,
                "classPath": linq.from(this.classPath).orderBy(function (x) { return x; }).toArray()
            });
        return this.jsonVars;
    };
    Build.prototype.mergeJson = function (content, vars) {
        util_1.log.verbose("merge json " + JSON.stringify(content) + "(vars " + JSON.stringify(vars) + ")");
        // get filename
        var fileName = (typeof content.dest == "string") && pathutil.basename(pathutil.extname(content.dest) ? content.dest : content.src);
        // get result map
        if (typeof content.dest == "function") {
            var map = content.dest;
            content.dest = function (file, done) {
                var json = JSON.parse(file.contents.toString());
                map(json, done);
            };
        }
        var src;
        if (typeof content.src == "string" || Array.isArray(content.src))
            src = this.util.src(content.src);
        else
            src = this.util.contentSrc(content.src);
        this.stream.add(src
            .pipe(jmerge({
            fileName: fileName,
            startObj: content.base,
            endObj: content.extend,
            jsonSpace: this.cfg.minify ? "" : "  ",
            jsonReplacer: content.replaceVars ? function (key, val) {
                if (typeof val == "string") {
                    var list = util_1.BuildUtil.replaceVars(val, vars);
                    if (list.length > 1)
                        return list;
                    return list[0];
                }
                return val;
            } : null
        }))
            .dest(content.dest));
    };
    Build.prototype.buildTs = function (content) {
        // get config
        content.options = deepAssign({}, this.cfg.tsc, content.options);
        // set out filename
        if (pathutil.extname(content.js))
            content.options.out = pathutil.basename(content.js);
        // set declaration
        if (content.dts)
            content.options.declaration = true;
        // log
        util_1.log.verbose("build ts " + JSON.stringify(content));
        // compile ts
        var ts = this.util.src(content.src)
            .pipe(this.sourcemapsInit(content.sourcemap))
            .pipe(typescript(content.options)).stream;
        // minify and save js
        if (ts.js && content.js)
            this.stream.add(this.util.extend(ts.js)
                .pipe(this.minifyJs())
                .pipe(this.sourcemapsWrite(content.sourcemap))
                .dest(this.dir(content.js)));
        // save dts
        if (ts.dts && content.dts)
            this.stream.add(this.util.extend(ts.dts)
                .pipe(this.rename(content.dts))
                .dest(this.dir(content.dts)));
    };
    Build.prototype.buildScss = function (content) {
        // log
        util_1.log.verbose("build scss " + JSON.stringify(content));
        // compile scss
        this.stream.add(this.util.src(content.src)
            .pipe(this.sourcemapsInit(content.sourcemap))
            .pipe(sass().on("error", sass.logError))
            .pipe(this.minifyCss())
            .pipe(this.rename(content.css))
            .pipe(this.sourcemapsWrite(content.sourcemap))
            .dest(this.dir(content.css)));
    };
    Build.prototype.javac = function (jar, opt, libs) {
        var res = javac(pathutil.basename(jar), opt);
        if (libs = this.util.getPath(libs))
            res = res.addLibraries(libs);
        return res;
    };
    Build.prototype.buildJava = function (content) {
        // get options
        content.options = deepAssign({}, this.cfg.javac, content.options);
        // log
        util_1.log.verbose("build java " + JSON.stringify(content));
        // compile java
        this.stream.add(this.util.src(content.src)
            .pipe(this.javac(content.jar, content.options, content.classPath))
            .dest(pathutil.dirname(content.jar)));
    };
    return Build;
}());
exports.Build = Build;
/** Defines a build series. */
var BuildSeries = /** @class */ (function () {
    /** Initializes a new instance. */
    function BuildSeries(builds) {
        this.builds = builds || [];
    }
    /** Adds the specified build. */
    BuildSeries.prototype.add = function (build) {
        this.builds.push(build);
    };
    /** Runs the series. */
    BuildSeries.prototype.run = function (cb) {
        async.series(linq.from(this.builds || []).select(function (b) {
            return function (next) {
                b.run().on("end", next);
            };
        }).toArray(), cb);
    };
    return BuildSeries;
}());
exports.BuildSeries = BuildSeries;

//# sourceMappingURL=build.js.map
