"use strict";
exports.__esModule = true;
var linq = require("linq");
var winston = require("winston");
require("colors");
var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["none"] = 0] = "none";
    LogLevel[LogLevel["error"] = 1] = "error";
    LogLevel[LogLevel["warn"] = 2] = "warn";
    LogLevel[LogLevel["info"] = 4] = "info";
    LogLevel[LogLevel["verbose"] = 8] = "verbose";
    LogLevel[LogLevel["debug"] = 16] = "debug";
    LogLevel[LogLevel["silly"] = 32] = "silly";
})(LogLevel = exports.LogLevel || (exports.LogLevel = {}));
var LogMask;
(function (LogMask) {
    LogMask[LogMask["none"] = 0] = "none";
    LogMask[LogMask["error"] = 1] = "error";
    LogMask[LogMask["warn"] = 3] = "warn";
    LogMask[LogMask["info"] = 7] = "info";
    LogMask[LogMask["verbose"] = 15] = "verbose";
    LogMask[LogMask["debug"] = 31] = "debug";
    LogMask[LogMask["silly"] = 63] = "silly";
})(LogMask = exports.LogMask || (exports.LogMask = {}));
// log utils
var lvlName = (process.env.log || process.env.LOG || "info").toLowerCase();
exports.mask = LogMask[lvlName];
if (exports.mask == undefined)
    exports.mask = LogMask.info;
// create winston logger
var logger = init(exports.mask);
/** Initializes a logger. */
function init(mask) {
    return winston.createLogger({
        level: LogMask[mask],
        transports: [
            new winston.transports.Console({
                format: getFormat(mask, process.env.NODE_ENV)
            })
        ]
    });
}
/** Returns the combined log format. */
function getFormat(mask, env) {
    var _a;
    var formats = [];
    formats.push(winston.format.timestamp({ format: mask == LogMask.debug || mask == LogMask.silly || env == "production" ? null : "hh:mm:ss" }));
    formats.push(winston.format.printf(env == "production" ? formatLogMsg : formatLogMsgColored));
    return (_a = winston.format).combine.apply(_a, formats);
}
/**  Formats the specified log message. */
function formatLogMsg(msg) {
    return "[" + msg.timestamp + "] [" + msg.level + "] " + msg.message + formatMeta(msg);
}
/**  Formats the log message colored. */
function formatLogMsgColored(msg) {
    return "[" + msg.timestamp.gray + "] [" + winston.format.colorize().colorize(msg.level, msg.level) + "] " + msg.message + formatMetaColored(msg);
}
/** Formats the meta data. */
function formatMeta(msg) {
    var meta = msg.meta;
    var metaStr = "";
    linq.from(meta).forEach(function (m) {
        linq.from(m).forEach(function (x) {
            if ((exports.mask & LogLevel[x.key]) != 0)
                metaStr += "\n" + "".padEnd(msg.timestamp.length + 2 - 7, " ") + " [meta] [" + x.key + "] " + exports.writeMeta(msg, x.value);
        });
    });
    return metaStr;
}
/** Formats the meta data colored. */
function formatMetaColored(msg) {
    var meta = msg.meta;
    var metaStr = "";
    linq.from(meta).forEach(function (m) {
        linq.from(m).forEach(function (x) {
            if ((exports.mask & LogLevel[x.key]) != 0)
                metaStr += "\n" + "".padEnd(msg.timestamp.length + 2 - 7, " ") + " [" + "meta".gray + "] [" + winston.format.colorize().colorize(x.key, x.key) + "] " + exports.writeMeta(msg, x.value);
        });
    });
    return metaStr;
}
exports.writeMeta = function (msg, meta) {
    return JSON.stringify(meta);
};
function isLogMeta(meta) {
    for (var key in meta)
        if (key != "error" && key != "warn" && key != "info" && key != "verbose" && key != "debug" && key != "silly")
            return false;
    return true;
}
function getMeta(logLevel, meta) {
    return { meta: linq.from(meta).select(function (x) {
            if (isLogMeta(x))
                return x;
            var m = {};
            m[logLevel] = x;
            return m;
        }).toArray() };
}
/** Sets the log mask. */
function setMask(logMask) {
    if (logMask == undefined) {
        error("Invalid log mask " + logMask);
        return;
    }
    // reinit logger
    logger = init(exports.mask = logMask);
}
exports.setMask = setMask;
function error(msg) {
    var meta = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        meta[_i - 1] = arguments[_i];
    }
    logger.error(msg, getMeta("error", meta));
}
exports.error = error;
function warn(msg) {
    var meta = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        meta[_i - 1] = arguments[_i];
    }
    logger.warn(msg, getMeta("warn", meta));
}
exports.warn = warn;
function info(msg) {
    var meta = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        meta[_i - 1] = arguments[_i];
    }
    logger.info(msg, getMeta("info", meta));
}
exports.info = info;
function verbose(msg) {
    var meta = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        meta[_i - 1] = arguments[_i];
    }
    logger.verbose(msg, getMeta("verbose", meta));
}
exports.verbose = verbose;
function debug(msg) {
    var meta = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        meta[_i - 1] = arguments[_i];
    }
    logger.debug(msg, getMeta("debug", meta));
}
exports.debug = debug;
function silly(msg) {
    var meta = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        meta[_i - 1] = arguments[_i];
    }
    logger.silly(msg, getMeta("silly", meta));
}
exports.silly = silly;
