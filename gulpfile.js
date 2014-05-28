var gulp = require('gulp');
var mocha = require('gulp-mocha');
var jshint = require('gulp-jshint');
var es = require('event-stream');

var paths = {
  tests: ['test/test*.js'],
  src: ['index.js'],
};

gulp.task('test', function() {
  gulp.src(paths.tests)
    .pipe(mocha({reporter: 'spec'}))
    .on('error', console.error);
});

gulp.task('jshint', function() {
  var through = es.through();
  gulp.src(paths.src)
    .pipe(jshint())
    .pipe(jshint.reporter('default'));
});

gulp.task('watch', function() {
  gulp.src(paths.tests)
    .pipe(mocha({reporter: 'spec'}))
    .on('error', console.error);
  gulp.watch(paths.tests, ['jshint', 'test']);
  gulp.watch(paths.src, ['jshint', 'test']);
});

gulp.task('default', ['test']);


