var gulp = require('gulp');
var concat = require('gulp-concat');
var autoprefixer = require('gulp-autoprefixer');


gulp.task('css', function () {
  gulp.src('css/*.css')
    .pipe(autoprefixer({
      browsers: ['> 1%'],
      cascade: false
    }))
    .pipe(concat('bundle.css'))
    .pipe(gulp.dest('bundle'))
});

gulp.task('js', function () {
  gulp.src('js/*.js')
    .pipe(concat('bundle.js'))
    .pipe(gulp.dest('bundle'));
});

gulp.task('default', ['css', 'js']);