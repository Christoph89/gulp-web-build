"use strict";
exports.__esModule = true;
var del = require("del");
var linq = require("linq");
var index_1 = require("./index");
var util_1 = require("./util");
/** Specifies utitilies to clean a project. */
var Clean = /** @class */ (function () {
    /** Initializes a new instance. */
    function Clean() {
        this.paths = [];
    }
    /** Deletes the specified paths. */
    Clean.prototype.del = function () {
        var paths = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            paths[_i] = arguments[_i];
        }
        (_a = this.paths).push.apply(_a, paths);
        return this;
        var _a;
    };
    /** Deletes all files excluded from vs code but leaves the specified paths. */
    Clean.prototype.delVSCodeExcludes = function () {
        var leave = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            leave[_i] = arguments[_i];
        }
        if (!leave)
            leave = [];
        if (!this.vscSettings)
            this.vscSettings = util_1.BuildUtil.readJson("./.vscode/settings.json");
        var exclude = this.vscSettings ? this.vscSettings["files.exclude"] : null;
        if (exclude)
            (_a = this.paths).push.apply(_a, linq.from(exclude).where(function (x) { return x.value && leave.indexOf(x.key) == -1; }).select(function (x) { return x.key; }).toArray());
        return this;
        var _a;
    };
    /** Deletes all specified paths. */
    Clean.prototype.run = function (cb) {
        return del(this.paths, { force: true }).then(function (paths) {
            index_1.log.info("Deleted " + (paths || []).length + " file(s). " + JSON.stringify(paths, null, "  "));
            cb();
        });
    };
    return Clean;
}());
exports.Clean = Clean;
