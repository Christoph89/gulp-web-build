import * as linq from "linq";
import * as winston from "winston";
import * as rotate from "winston-daily-rotate-file";
import * as path from "path";
import { TransformableInfo } from "logform";
import { merge } from "./index";
import * as colors from "colors";
require("colors");

export enum LogLevel
{
  none=0,
  error=1<<0,
  warn=1<<1,
  info=1<<2,
  verbose=1<<3,
  debug=1<<4,
  silly=1<<5
}

export enum LogMask
{
  none=0,
  error=1,
  warn=3,
  info=7,
  verbose=15,
  debug=31,
  silly=63
}

// log utils
var lvlName=(process.env.log || process.env.LOG || "info");
var logDir, logFile;
if (lvlName.indexOf(","))
{
  var parts=lvlName.split(",");
  lvlName=parts[0];
  if (parts.length>1)
  {
    logDir=path.dirname(parts[1]);
    logFile=path.basename(parts[1]).replace("DATE", "%DATE%");
  }
}
lvlName=lvlName.toLowerCase();
export var mask: LogMask=LogMask[lvlName];
if (mask==undefined) mask=LogMask.info;

// create winston logger
var logger=init(mask);

/** Initializes a logger. */
function init(mask: LogMask): winston.Logger
{
  var transport;
  if (logDir && logFile)
    transport=new rotate({
      filename: logFile,
      dirname: logDir,
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true
    });
  else
    transport=new winston.transports.Console({
      format: getFormat(mask, process.env.NODE_ENV),
    });

  return winston.createLogger({
    level: LogMask[mask],
    transports: [
      transport
    ]
  });
}

/** Returns the combined log format. */
function getFormat(mask: LogMask, env: string)
{
  var formats=[];
  formats.push(winston.format.timestamp({ format: mask==LogMask.debug||mask==LogMask.silly||env=="production"?null:"hh:mm:ss" }));
  formats.push(winston.format.printf(env=="production"?formatLogMsg:formatLogMsgColored));
  return winston.format.combine(...formats);
}

/**  Formats the specified log message. */
function formatLogMsg(msg: TransformableInfo)
{
  return `[${msg.timestamp}] [${msg.level}] ${msg.message}`+formatMeta(msg);
}

/**  Formats the log message colored. */
function formatLogMsgColored(msg: TransformableInfo)
{
  return `[${msg.timestamp.gray}] [${winston.format.colorize().colorize(msg.level, msg.level)}] ${msg.message}`+formatMetaColored(msg);
}

/** Formats the meta data. */
function formatMeta(msg: TransformableInfo)
{
  var meta=msg.meta;
  var metaStr="";
  linq.from(meta).forEach(m => {
    linq.from(m).forEach(x => {
      if ((mask&LogLevel[x.key])!=0)
        metaStr+=`\n${"".padEnd(msg.timestamp.length+2-7, " ")} [meta] [${x.key}] ${writeMeta(msg, x.value)}`;
    });
  });
  return metaStr;
}

/** Formats the meta data colored. */
function formatMetaColored(msg: TransformableInfo)
{
  var meta=msg.meta;
  var metaStr="";
  linq.from(meta).forEach(m => {
    linq.from(m).forEach(x => {
      if ((mask&LogLevel[x.key])!=0)
        metaStr+=`\n${"".padEnd(msg.timestamp.length+2-7, " ")} [${"meta".gray}] [${winston.format.colorize().colorize(x.key, x.key)}] ${writeMeta(msg, x.value)}`;
    });
  });
  return metaStr;
}

export var writeMeta=function(msg: TransformableInfo, meta: any)
{
  return JSON.stringify(meta);
};

/** Defines log meta. */
export interface LogMeta
{
  error?: any;
  warn?: any;
  info?: any;
  verbose?: any;
  debug?: any;
  silly?: any;
}

function isLogMeta(meta: any)
{
  for (var key in meta)
    if (key!="error" && key!="warn" && key!="info" && key!="verbose" && key!="debug" && key!="silly")
      return false;
  return true;
}

function getMeta(logLevel: string, meta: (LogMeta|any)[])
{
  return { meta: linq.from(meta).select(x => {
    if (isLogMeta(x))
      return x;
    var m={};
    m[logLevel]=x;
    return m;
  }).toArray() };
}

/** Sets the log mask. */
export function setMask(logMask: LogMask)
{
  if (logMask==undefined)
  {
    error(`Invalid log mask ${logMask}`);
    return;
  }

  // reinit logger
  logger=init(mask=logMask);
}

export function error(msg: string, ...meta: (LogMeta|any)[]) { logger.error(msg, getMeta("error", meta)); }
export function warn(msg: string, ...meta: (LogMeta|any)[]) { logger.warn(msg, getMeta("warn", meta)); }
export function info(msg: string, ...meta: (LogMeta|any)[]) { logger.info(msg, getMeta("info", meta)); }
export function verbose(msg: string, ...meta: (LogMeta|any)[]) { logger.verbose(msg, getMeta("verbose", meta)); }
export function debug(msg: string, ...meta: (LogMeta|any)[]) { logger.debug(msg, getMeta("debug", meta)); }
export function silly(msg: string, ...meta: (LogMeta|any)[]) { logger.silly(msg, getMeta("silly", meta)); }