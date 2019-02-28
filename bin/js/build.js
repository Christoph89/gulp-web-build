"use strict";
exports.__esModule = true;
var fs = require("fs");
var linq = require("linq");
var pathutil = require("path");
var empty = require("gulp-empty");
var rename = require("gulp-rename");
var data = require("gulp-data");
var sass = require("gulp-sass");
var javac = require("gulp-javac");
var uglify = require("gulp-uglify");
var uglifycss = require("gulp-uglifycss");
var typescript = require("gulp-typescript");
var sourcemaps = require("gulp-sourcemaps");
var jmerge = require("gulp-merge-json");
var file = require("gulp-file");
var tplrender = require("gulp-nunjucks-render");
var tpldata = require("gulp-data");
var async = require("async");
var def_1 = require("./def");
var util_1 = require("./util");
var index_1 = require("./index");
var log = require("./log");
var stream_1 = require("./stream");
var mergeStream = require("merge-stream"); // merge-stream does not support ES6 import
/** Class for building web applications. */
var Build = /** @class */ (function () {
    function Build(cfg) {
        this.buildContent = [];
        this.vscClassPath = [];
        this.classPath = [];
        if (!cfg)
            cfg = {};
        this.init(cfg);
    }
    /** Initializes the current build. */
    Build.prototype.init = function (cfg) {
        this.cfg = cfg;
        var clone = index_1.merge({}, cfg);
        this.util = new util_1.BuildUtil(this.cfg = index_1.merge(this.cfg, {
            // default config
            // default encoding=utf8
            prj: process.cwd(),
            minify: process.env.minify == "true" || process.argv.indexOf("--dist") > -1,
            sourcemaps: process.env.sourcemaps != "false" && process.argv.indexOf("--dist") == -1
        }, clone));
        var vscodeSettings = cfg.prj ? pathutil.join(cfg.prj, "./.vscode/settings.json") : null;
        if (vscodeSettings && fs.existsSync(vscodeSettings)) {
            var vscSettings = this.vscSettings = this.readJson(vscodeSettings);
            if (vscSettings) {
                this.vscClassPath = this.resolveClassPath(vscSettings["java.classPath"] || []);
                this.classPath = this.classPath.concat(this.vscClassPath);
                if (this.vscClassPath.length)
                    log.info("add vs code classpath " + JSON.stringify(this.vscClassPath));
            }
        }
    };
    Build.prototype.add = function (src, dest) {
        if (arguments.length == 1)
            this.buildContent.push(src);
        else
            this.buildContent.push({ contentType: def_1.BuildContentType.Static, src: src, dest: dest });
        return this;
    };
    Build.prototype.addFile = function (content, filename, dest) {
        if (arguments.length == 1)
            this.buildContent.push(content);
        else
            this.buildContent.push({ contentType: def_1.BuildContentType.File, content: content, filename: filename, dest: dest });
        return this;
    };
    Build.prototype.addTpl = function (src, path, dest, data) {
        if (arguments.length == 1)
            this.buildContent.push(src);
        else
            this.buildContent.push({
                contentType: def_1.BuildContentType.Tpl,
                src: src,
                dest: dest,
                path: path,
                data: data
            });
        return this;
    };
    Build.prototype.addJson = function (src, dest, extend, base, replaceVars) {
        if (replaceVars === void 0) { replaceVars = true; }
        if (arguments.length == 1)
            this.buildContent.push(src);
        else
            this.buildContent.push({
                contentType: def_1.BuildContentType.Json,
                src: src,
                dest: dest,
                extend: extend,
                replaceVars: replaceVars
            });
        return this;
    };
    /** Extends the config by the specified json file. */
    Build.prototype.config = function (src, filter, replaceVars) {
        var _this = this;
        if (replaceVars === void 0) { replaceVars = true; }
        if (Array.isArray(src)) {
            var b = this;
            linq.from(src).forEach(function (x) {
                b = b.config(x, filter, replaceVars);
            });
            return b;
        }
        // surround with property?
        var prop;
        if (typeof src === "string" && src.indexOf("=") > -1) {
            var parts = src.split("=");
            prop = parts[0];
            src = parts[1];
        }
        var content;
        return this.addJson((content = {
            contentType: def_1.BuildContentType.Json,
            src: src,
            dest: function (file) { return _this.setConfigFromFile(file, content, prop); },
            filter: filter,
            replaceVars: replaceVars
        }));
    };
    Build.prototype.addTs = function (src, js, dts, sourcemap, options) {
        if (arguments.length == 1)
            this.buildContent.push(src);
        else
            this.buildContent.push({
                contentType: def_1.BuildContentType.Typescript,
                src: src,
                js: js,
                dts: dts,
                sourcemap: sourcemap,
                options: options
            });
        return this;
    };
    Build.prototype.addScss = function (src, css, sourcemap) {
        if (arguments.length == 1)
            this.buildContent.push(src);
        else
            this.buildContent.push({
                contentType: def_1.BuildContentType.Scss,
                src: src,
                css: css,
                sourcemap: sourcemap
            });
        return this;
    };
    Build.prototype.addJava = function (src, jar, classpath, options) {
        // resolve classpaths
        if (typeof classpath == "string")
            classpath = [classpath]; // ensure array
        classpath = this.resolveClassPath(classpath);
        this.buildContent.push({
            contentType: def_1.BuildContentType.Java,
            src: src,
            jar: jar,
            classPath: this.vscClassPath.concat(classpath || []),
            options: options
        });
        // add classpath
        this.classPath.push(jar = this.resolveClassPath(jar));
        log.info("add classpath " + jar);
        if (classpath && classpath.length) {
            this.classPath = linq.from(this.classPath).union(linq.from(classpath)).toArray(); // remember classpaths
            log.info("add classpath " + JSON.stringify(classpath));
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
    /** Resolves the specified data and replaces vars. */
    Build.prototype.resolveRecursive = function (data) {
        return util_1.BuildUtil.replaceVarsRecursive(data, this.cfg);
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
    Build.prototype.run = function (cb) {
        log.debug("Start build");
        var build = this;
        async.series(linq.from(this.buildContent)
            .select(function (content, idx) {
            return function (next) {
                var stream = build.createStream(content);
                if (stream && (!stream.isEmpty || !stream.isEmpty())) {
                    log.debug("Start " + stream.logMsg, { debug: stream.meta });
                    stream.on("finish", function (err, res) {
                        log.debug("Finished " + stream.logMsg, { debug: stream.meta });
                        if (next)
                            next(err, res);
                        next = null;
                    })
                        .on("error", function (err) {
                        log.error(err);
                        if (next)
                            next(err);
                        next = null;
                    });
                }
                else {
                    log.warn("Skipped empty stream!", stream ? stream.logMsg : null);
                    if (next)
                        next(undefined, undefined);
                    next = null;
                }
            };
        }).toArray(), function (err) {
            log.debug("Finished build");
            if (cb)
                return cb(err);
        });
    };
    Build.prototype.createStream = function (content) {
        switch (content.contentType) {
            case def_1.BuildContentType.Static: return this.copyStatic(content);
            case def_1.BuildContentType.File: return this.writeFile(content);
            case def_1.BuildContentType.Tpl: return this.renderTpl(content);
            case def_1.BuildContentType.Json: return this.mergeJson(content);
            case def_1.BuildContentType.Typescript: return this.buildTs(content);
            case def_1.BuildContentType.Scss: return this.buildScss(content);
            case def_1.BuildContentType.Java: return this.buildJava(content);
        }
        return null;
    };
    Build.prototype.extStream = function (source, logMsg, content) {
        if (!source)
            source = { isEmpty: function () { return true; } };
        source.logMsg = logMsg || "";
        source.meta = index_1.merge(source.meta || {}, { content: content });
        return source;
    };
    Build.prototype.copyStatic = function (content) {
        return this.extStream(this.util.copy(content.src, content.dest), "copy", content);
    };
    Build.prototype.writeFile = function (content) {
        if (typeof content.content == "function")
            content.content = content.content(this);
        return this.extStream(new stream_1.GulpStream(this.cfg, file(content.filename, content.content, { src: true }), { fileContent: content }).dest(content.dest), "write file", content);
    };
    Build.prototype.renderTpl = function (content) {
        if (!content.data)
            content.data = {};
        var getData = typeof content.data == "function"
            ? function (f) { return content.data(f, content); }
            : function (f) { return content.data; };
        return this.extStream(this.util.src(content.src)
            .pipe(tpldata(getData))
            .pipe(tplrender({ path: this.resolve(content.path) }))
            .dest(content.dest), "render tpl", content);
    };
    Build.prototype.extendSourcemapOpts = function (opts, src, dest) {
        if (!src || !dest)
            return null;
        var srcDir = (this.util.getPath(this.dir(src)) || [])[0];
        var destDir = (this.util.getPath(this.dir(dest)) || [])[0];
        return index_1.merge({
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
        if (this.cfg.sourcemaps && opt)
            return sourcemaps.init(opt);
        return empty();
    };
    Build.prototype.sourcemapsWrite = function (opt) {
        if (this.cfg.sourcemaps && opt)
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
    Build.prototype.setConfigFromFile = function (file, content, prop) {
        log.verbose("set config", content);
        // get json from file
        var jstr = String(file.contents);
        var json = JSON.parse(jstr);
        // wrap json into property
        if (prop) {
            var h = {};
            h[prop] = json;
            json = h;
        }
        index_1.merge(this.cfg, json);
        log.verbose("config set", this.cfg);
        return file;
    };
    Build.prototype.filterJson = function (filter) {
        var _this = this;
        if (filter && !Array.isArray(filter))
            filter = [filter];
        if (filter && filter.length) {
            if (typeof filter[0] == "string")
                filter = [filter];
            return data(function (file) {
                var json = JSON.parse(String(file.contents));
                linq.from(filter).forEach(function (f) {
                    if (typeof f == "function")
                        json = f(json);
                    else // string[]
                     {
                        var filtered = {};
                        linq.from(f).forEach(function (prop) {
                            if (prop[0] == "<")
                                index_1.merge(filtered, json[prop.substr(1)]);
                            else
                                filtered[prop] = json[prop];
                        });
                        json = filtered;
                    }
                });
                file.contents = new Buffer(JSON.stringify(json, null, _this.cfg.minify ? "" : "  "));
                return json;
            });
        }
        return empty();
    };
    Build.prototype.getJsonVars = function (vars) {
        return index_1.merge({}, this.cfg, {
            "vscClassPath": this.vscClassPath,
            "classPath": linq.from(this.classPath).orderBy(function (x) { return x; }).toArray()
        }, vars);
    };
    Build.prototype.mergeJson = function (content) {
        var _this = this;
        // get source
        var src;
        if (typeof content.src == "function")
            content.src = content.src(this);
        if (typeof content.src == "string" || Array.isArray(content.src))
            src = this.util.src(content.src);
        else
            src = this.util.contentSrc(content.src);
        // get filename
        var fileName = pathutil.basename(typeof content.dest == "string" && pathutil.extname(content.dest) ? content.dest : (typeof content.src == "string" ? content.src : "tmp.txt"));
        return this.extStream(src
            .pipe(jmerge({
            fileName: fileName,
            startObj: content.base,
            endObj: content.extend,
            jsonSpace: this.cfg.minify ? "" : "  ",
            jsonReplacer: content.replaceVars ? function (key, val) {
                if (typeof val == "string") {
                    var list = util_1.BuildUtil.replaceVars(val, _this.getJsonVars(content.vars));
                    if (list.length > 1)
                        return list;
                    return list[0];
                }
                return val;
            } : null
        }))
            .pipe(this.filterJson(content.filter))
            .dest(content.dest), "merge json", content);
    };
    Build.prototype.buildTs = function (content) {
        // get config
        content.options = index_1.merge({}, this.cfg.tsc, content.options);
        // set out filename
        if (pathutil.extname(content.js))
            content.options.out = pathutil.basename(content.js);
        // set declaration
        if (content.dts)
            content.options.declaration = true;
        // set sourcemap options
        if (content.sourcemap)
            content.sourcemap = this.extendSourcemapOpts(content.sourcemap, content.src, content.js);
        // compile ts
        var ts = this.util.src(content.src)
            .pipe(this.sourcemapsInit(content.sourcemap))
            .pipe(typescript(content.options)).stream;
        var tsStream = this.extStream(ts, "build ts", content);
        // minify and save js
        if (ts && ts.js && content.js)
            this.util.extend(ts.js, ts.meta)
                .pipe(this.minifyJs())
                .pipe(this.sourcemapsWrite(content.sourcemap))
                .dest(this.dir(content.js)).on("finish", function () {
                log.silly("Finished ts-js");
            });
        // save dts
        if (ts && ts.dts && content.dts)
            this.util.extend(ts.dts, ts.meta)
                .pipe(this.rename(content.dts))
                .dest(this.dir(content.dts)).on("finish", function () {
                log.silly("Finished dts");
            });
        return tsStream;
    };
    Build.prototype.buildScss = function (content) {
        // set sourcemap options
        if (content.sourcemap)
            content.sourcemap = this.extendSourcemapOpts(content.sourcemap, content.src, content.css);
        // compile scss
        return this.extStream(this.util.src(content.src)
            .pipe(this.sourcemapsInit(content.sourcemap))
            .pipe(sass().on("error", sass.logError))
            .pipe(this.minifyCss())
            .pipe(this.rename(content.css))
            .pipe(this.sourcemapsWrite(content.sourcemap))
            .dest(this.dir(content.css)), "build scss", content);
    };
    Build.prototype.javac = function (jar, opt, libs) {
        var res = javac(pathutil.basename(jar), opt);
        if (libs = this.util.getPath(libs))
            res = res.addLibraries(libs);
        return res;
    };
    Build.prototype.buildJava = function (content) {
        // get options
        content.options = index_1.merge({}, this.cfg.javac, content.options);
        // compile java
        return this.extStream(this.util.src(content.src)
            .pipe(this.javac(content.jar, content.options, content.classPath))
            .dest(pathutil.dirname(content.jar)), "build java", content);
    };
    return Build;
}());
exports.Build = Build;
