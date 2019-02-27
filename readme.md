#gulp-web-build

Util for building a web application with gulp.

## Install and build
npm install
gulp prep
gulp build

## Debug
**Set log level**
log=error|warn|info|verbose|debug|silly gulp build

**Write log to file**
NODE_ENV=production gulp build > output.log

**Write lot to file and console**
NODE_ENV=production gulp build 2>&1 | tee output.log