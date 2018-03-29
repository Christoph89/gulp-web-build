"use strict";
exports.__esModule = true;
var fs = require("fs");
var linq = require("linq");
var deepAssign = require("deep-assign");
var pathutil = require("path");
var index_1 = require("./index");
var util_1 = require("./util");
/** Initializer for vs code projects. */
var VSCode = /** @class */ (function () {
    /** Initializes a new instance. */
    function VSCode(cfg) {
        this.debuggers = [];
        this.tasks = [];
        this.settings = {};
        this.cfg = deepAssign({
            // default config
            prj: process.cwd()
        }, cfg);
        // init build
        this.build = new index_1.Build({ prj: this.cfg.prj });
    }
    /** Adds a debugger. */
    VSCode.prototype.addDebugger = function () {
        var dbg = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            dbg[_i] = arguments[_i];
        }
        (_a = this.debuggers).push.apply(_a, linq.from(dbg).selectMany(function (x) { return Array.isArray(x) ? x : [x]; }).toArray());
        return this;
        var _a;
    };
    /** Add a task. */
    VSCode.prototype.addTask = function () {
        var task = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            task[_i] = arguments[_i];
        }
        (_a = this.tasks).push.apply(_a, task);
        return this;
        var _a;
    };
    /** Adds all gulp tasks. */
    VSCode.prototype.addGulpTasks = function () {
        var _this = this;
        var tasks = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            tasks[_i] = arguments[_i];
        }
        // use passed or get registered tasks
        if (!tasks || !tasks.length)
            tasks = index_1.registeredTasks();
        else if (tasks.length && (typeof tasks[0] == "string"))
            tasks = linq.from(tasks).select(function (x) { return ({ name: x }); }).toArray(); // convert string array
        linq.from(tasks).forEach(function (t) {
            return _this.addTask({
                label: t.name,
                command: "gulp",
                type: "shell",
                args: (_a = [t.name]).concat.apply(_a, (t.args || [])),
                group: t.group || "none",
                presentation: {
                    reveal: "always",
                    panel: "new"
                },
                problemMatcher: []
            });
            var _a;
        });
        return this;
    };
    /** Adds the specified java dependencies to settings.json. */
    VSCode.prototype.addJavaClasspath = function () {
        var dependencies = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            dependencies[_i] = arguments[_i];
        }
        if (!this.settings["java.classPath"])
            this.settings["java.classPath"] = [];
        (_a = this.settings["java.classPath"]).push.apply(_a, dependencies);
        return this;
        var _a;
    };
    /** Adds all java dependencies specified at the javaDependencies property in package.json  */
    VSCode.prototype.addNpmJavaDepdencies = function () {
        var _this = this;
        var pkg = this.build.readJson("%prj/package.json");
        // read java dependencies from package.json javaDependencies property
        if (pkg.javaDependencies)
            linq.from(pkg.javaDependencies).forEach(function (x) {
                var resolved = _this.resolveNpmJavaDependency(x);
                if (resolved)
                    _this.addJavaClasspath.apply(_this, resolved);
            });
        return this;
    };
    /** Resolves the specified java dependency. */
    VSCode.prototype.resolveNpmJavaDependency = function (dependency) {
        var prj = this.build.resolveFirst("%prj/");
        // is local dependency path?
        var h = dependency[0];
        if (h == "." || h == "/" || h == "\\" || h == "~")
            return [dependency];
        // else npm dependency
        var dir = prj + "node_modules/" + dependency + "/";
        var pkg = this.build.readJson(dir + "package.json");
        if (!pkg.java)
            return null;
        // read jars from package.json java property
        var paths = Array.isArray(pkg.java) ? pkg.java : [pkg.java];
        return linq.from(paths).select(function (x) { return pathutil.relative(prj, pathutil.join(dir, x)); }).toArray();
    };
    /** Excludes the specified paths from vs code. */
    VSCode.prototype.exclude = function () {
        var _this = this;
        var paths = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            paths[_i] = arguments[_i];
        }
        var fx = this.settings["files.exclude"];
        if (!fx)
            fx = {};
        linq.from(paths).selectMany(function (p) { return Array.isArray(p) ? p : [p]; }).forEach(function (p) {
            linq.from(_this.build.resolve(p)).forEach(function (x) {
                fx[x] = true;
            });
        });
        this.settings["files.exclude"] = fx;
        return this;
    };
    /** Excludes all paths from .gitignore from vs code.*/
    VSCode.prototype.excludeGitIgnores = function () {
        if (!fs.existsSync(".gitignore"))
            return;
        var paths = linq.from(util_1.BuildUtil.readLines(".gitignore")).where(function (l) {
            var trimmed = l.trim();
            return trimmed != ".vscode" && trimmed[0] != "#"; // do not exclude .vscode and gitignore comments
        }).toArray();
        this.exclude.apply(this, paths);
        return this;
    };
    VSCode.prototype.run = function (cb) {
        // add launch.json
        if (this.debuggers.length) {
            index_1.log.info("add debuggers to .vscode/launch.json");
            this.build.addJson({
                version: VSCode.launchJsonVersion,
                configurations: this.debuggers
            }, "%prj/.vscode/launch.json");
        }
        // add tasks.json
        if (this.tasks.length) {
            index_1.log.info("add tasks to .vscode/tasks.json");
            this.build.addJson({
                version: VSCode.tasksJsonVersion,
                tasks: this.tasks
            }, "%prj/.vscode/tasks.json");
        }
        // add settings.json
        if (this.settings && linq.from(this.settings).count() > 0) {
            index_1.log.info("add settings.json");
            var path = this.build.resolveFirst("%prj/.vscode/settings.json");
            this.build.addJson({}, path, this.settings);
        }
        // run
        return this.build.run(cb);
    };
    VSCode.launchJsonVersion = "0.2.0";
    VSCode.tasksJsonVersion = "2.0.0";
    return VSCode;
}());
exports.VSCode = VSCode;
/** Contains debuggers. */
var VSCodeDebuggers;
(function (VSCodeDebuggers) {
    /** Gulp build debugger.
     * @param buildTask Specifies the build task. default=build
     */
    function Gulp() {
        var tasks = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            tasks[_i] = arguments[_i];
        }
        if (!tasks || !tasks.length)
            tasks = linq.from(index_1.registeredTasks()).select(function (x) { return x.name; }).toArray();
        return linq.from(tasks).select(function (task) { return Node("Gulp " + task, "node_modules/gulp/bin/gulp.js", [task]); }).toArray();
    }
    VSCodeDebuggers.Gulp = Gulp;
    /** Node debugger.
     * @param name Name of the debugger
     * @param js Path to your node js file relative to your workspace root.
     * @param env Environment variables.
     * @param args Command line args.
     */
    function Node(name, js, args, env) {
        // merge environment vars
        env = deepAssign({}, {
            "TS_NODE_CACHE_DIRECTORY": "${workspaceRoot}/.node",
            "LOG": "debug"
        }, env);
        return {
            type: "node",
            request: "launch",
            name: name,
            program: "${workspaceRoot}/" + js,
            args: args,
            cwd: "${workspaceRoot}",
            sourceMaps: true,
            outFiles: ["${workspaceRoot}/.node"],
            env: env,
            protocol: "inspector",
            console: "integratedTerminal"
        };
    }
    VSCodeDebuggers.Node = Node;
    /** Node web application debugger.
     * @param bin Specifies the bin folder. default=${workspaceRoot}/bin
     * @param start Specifies the start js file relative to bin. default=www.js
     */
    function NodeWebApplication(bin, start) {
        if (bin === void 0) { bin = "${workspaceRoot}/bin"; }
        if (start === void 0) { start = "www.js"; }
        return {
            type: "node",
            request: "launch",
            name: "Run web application",
            program: bin + "/www.js",
            cwd: "${workspaceRoot}",
            sourceMaps: true,
            outFiles: [bin + "/**/*.js"],
            env: {
                "DEBUG": "express:*"
            },
            protocol: "inspector",
            console: "integratedTerminal"
        };
    }
    VSCodeDebuggers.NodeWebApplication = NodeWebApplication;
})(VSCodeDebuggers = exports.VSCodeDebuggers || (exports.VSCodeDebuggers = {}));
