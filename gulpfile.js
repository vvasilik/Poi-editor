const {src, dest, task, watch, series} = require('gulp');
const babel = require('gulp-babel');
const uglify = require('gulp-uglify');
const rename = require('gulp-rename');
const concat = require('gulp-concat');

function js() {
    return src('js/*.js')
        .pipe(babel())
        .pipe(uglify())
        .pipe(rename('bundle.js'))
        .pipe(dest('bundle/'));
}

function css() {
    return src('css/*.css')
        .pipe(concat('bundle.css'))
        .pipe(dest('bundle/'))
}

task('watch', function() {
    watch(['js/*', 'css/*'], series([js, css]))
});

exports.default = series([js, css]);