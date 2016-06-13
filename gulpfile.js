const gulp = require('gulp')
const traceur = require('gulp-traceur')
const sourcemaps = require('gulp-sourcemaps')
const clean = require('gulp-clean')
const uglify = require('gulp-uglify')
const markdox = require('gulp-markdox')
const rename = require('gulp-rename')
const insert = require('gulp-insert')
const concat = require('gulp-concat')

gulp.task('default', ['docs'], () => {
  gulp.src('src/sprinting.js')
    .pipe(sourcemaps.init())
    .pipe(traceur({
      properTailCalls: true,
      symbols: true,
      arrayComprehension: true,
      asyncFunctions: true,
      asyncGenerators: true,
      forOn: true,
      generatorComprehension: true
    }))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('dist'))
    .pipe(uglify())
    .pipe(rename('sprinting.min.js'))
    .pipe(gulp.dest('dist'))
})

gulp.task('docs', ['clean'], () => {
  gulp.src('src/**/*.js')
    .pipe(markdox())
    .pipe(concat('documentation.md'))
    .pipe(insert.prepend('# API Documentation\n> Unless otherwise stated, everything is under the scope of `Sprinting`.'))
    .pipe(gulp.dest('./'))
})

gulp.task('clean', () => gulp.src('dist', { read: false }).pipe(clean()) )

gulp.task('watch', () => gulp.watch('src/**/*.js', ['default']))