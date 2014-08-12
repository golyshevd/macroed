'use strict';

var _ = require('lodash-node');
var gulp = require('gulp');
var glob = require('glob');
var path = require('path');

_.forEach(glob.sync('tools/tasks/*.js'), function (filename) {
    require(path.resolve(filename)).call(gulp);
});

gulp.task('default', ['test']);
