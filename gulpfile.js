const gulp = require('gulp')
const traceur = require('gulp-traceur')
const sourcemaps = require('gulp-sourcemaps')
const clean = require('gulp-clean')
const uglify = require('gulp-uglify')
const rename = require('gulp-rename')
const insert = require('gulp-insert')
const shell = require('gulp-shell')
const browserify = require('gulp-browserify')
const path = require('path')

gulp.task('default', ['docs', 'build'])

gulp.task('build', ['build-clean'], () => {
  gulp.src('src/sprinting.js')
    .pipe(sourcemaps.init())
    .pipe(traceur())
    .pipe(sourcemaps.write())
    .pipe(browserify({
      debug: true,
      loadMaps: true
    }))
    .pipe(gulp.dest('dist'))
    .pipe(uglify())
    .pipe(rename('sprinting.min.js'))
    .pipe(gulp.dest('dist'))
})

gulp.task('docs', ['docs-clean'], shell.task(
  `${path.normalize('./node_modules/.bin/jsdoc')} src -r -c jsdoc.json -d docs`
  ))

gulp.task('build-clean', () => gulp.src(['dist/*'], { read: false }).pipe(clean()) )
gulp.task('docs-clean', () => gulp.src(['docs/*'], { read: false }).pipe(clean()) )

gulp.task('watch', () => {
  gulp.watch('src/**/*.js', ['default'])
  gulp.watch('node_modules/jsdoc-baseline/**/*.*', ['docs'])
})
