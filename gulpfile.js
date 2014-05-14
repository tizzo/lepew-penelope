var gulp = require('gulp');
var mocha = require('gulp-mocha');

gulp.task('default', function() {
  gulp.src('test/testRunCommands.js')
    .pipe(mocha({reporter: 'spec'}));
});


