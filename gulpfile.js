const gulp = require('gulp')
const traceur = require('gulp-traceur')
const sourcemaps = require('gulp-sourcemaps')
const clean = require('gulp-clean')
const uglify = require('gulp-uglify')
const rename = require('gulp-rename')
const insert = require('gulp-insert')
const shell = require('gulp-shell')
const browserify = require('gulp-browserify')

gulp.task('default', ['docs', 'clean'], () => {
  gulp.src('src/sprinting.js')
    .pipe(sourcemaps.init())
    .pipe(traceur({
      properTailCalls: true,
      symbols: true,
      arrayComprehension: true,
      asyncFunctions: true,
      asyncGenerators: true,
      forOn: true,
      generatorComprehension: true,
      modules: 'commonjs'
    }))
    .pipe(browserify({
      debug: true
    }))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('dist'))
    //.pipe(uglify())
    //.pipe(rename('sprinting.min.js'))
    //.pipe(gulp.dest('dist'))
})

gulp.task('docs', shell.task('./node_modules/.bin/jsdoc src -r -c jsdoc.json -d docs'))

gulp.task('clean', () => gulp.src(['dist/*', 'docs/*'], { read: false }).pipe(clean()) )

gulp.task('watch', () => {
  gulp.watch('src/**/*.js', ['default'])
})