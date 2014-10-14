var gulp = require('gulp');
var mocha = require('gulp-mocha');
var jshint = require('gulp-jshint');
var jscs = require('gulp-jscs');
var es = require('event-stream');

var paths = {
  tests: ['test/test*.js'],
  src: ['index.js', 'lib/**.js', 'bin/penelope'],
};

gulp.task('test', function() {
  return gulp.src(paths.tests)
    .pipe(mocha({reporter: 'spec'}))
    .on('error', console.error);
});

gulp.task('jshint', function() {
  var through = es.through();
  return gulp.src(paths.src)
    .pipe(jshint())
    .pipe(jshint.reporter('default'));
});

gulp.task('jscs', function() {
  return gulp.src(paths.src)
    .pipe(jscs());
});

gulp.task('watch', function() {
  gulp.src(paths.tests)
    .pipe(mocha({reporter: 'spec'}))
    .on('error', console.error);
  gulp.watch(paths.tests, ['jscs', 'jshint', 'test']);
  gulp.watch(paths.src, ['jscs', 'jshint', 'test']);
});

gulp.task('default', ['test']);


