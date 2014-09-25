'use strict';
var gulp = require('gulp');

// var grunt-rimraf = require('grunt-rimraf');
var rimraf = require('rimraf');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var size = require('gulp-size');
var rename = require('gulp-rename');
var gutil = require('gulp-util');
var minifyHTML = require('gulp-minify-html');
var minifyCSS = require('gulp-minify-css');
var useref = require('gulp-useref');
var merge = require('merge-stream');
var gulpif = require('gulp-if');

var DEV_PUBLIC = './public';
var DIST_PUBLIC = './public_dist';

function appendDevPublic (src) {
  return DEV_PUBLIC + '/' + src;
}

gulp.task('default', ['watch']);

gulp.task('clean', function (cb) {
  rimraf(DIST_PUBLIC, cb);
});

gulp.task('watch', function() {
  gulp.watch('public/**/*.css', ['buildCSS']);
  gulp.watch('public/**/*.js', ['buildJS']);
  gulp.watch('public/**/*.html', ['buildHTML']);
});

gulp.task('build', ['buildHTML', 'buildJS', 'buildCSS']);
gulp.task('buildProd', ['buildHTML', 'buildProdJS', 'buildCSS']);

gulp.task('buildHTML', function() {
  gulp.src(DEV_PUBLIC + '/app.html')
    .pipe(useref())
    .pipe(minifyHTML({ conditionals: true })) // IE conditionals remain
    .pipe(size({showFiles: true}))
    .pipe(gulp.dest(DIST_PUBLIC))
    .on('error', gutil.log);
});


gulp.task('buildCSS', function() {
  var cssComponents = [
  'components/toastr/toastr.min.css',
  'components/font-awesome/css/font-awesome.min.css'
  ];

  var cssDependencies = [
    'css/fonts.css',
    'css/style.css',
    'css/style2.css',
    'css/style-desktop.css',
    'css/style-mobile.css'
  ];

  var cssDir = DIST_PUBLIC + '/css';

  var sources = cssComponents.concat(cssDependencies).map(appendDevPublic);

  var css = gulp.src(sources)
    .pipe(concat('build.css'))
    // .pipe(gulp.dest(cssDir))
    .pipe(minifyCSS())
    // .pipe(rename('build.css'))
    .pipe(size({showFiles: true}))
    .pipe(gulp.dest(cssDir))
    .on('error', gutil.log);

  var ieCss = gulp.src(DEV_PUBLIC + '/css/ie*.css')
    .pipe(gulp.dest(cssDir));

  var fontSources = [
    'components/font-awesome/fonts/*',
    'fonts/*'
  ].map(appendDevPublic);

  var fonts = gulp.src(fontSources)
    .pipe(gulp.dest(DIST_PUBLIC + '/fonts'));

  var images = gulp.src(DEV_PUBLIC + '/css/images/*')
    .pipe(gulp.dest(cssDir + '/images'));

  return merge(css, ieCss, fonts, images);
});

function buildJSFromSources(isProdBuild) {
  var jsComponents = [
    'components/jquery/dist/jquery.js',
    'components/moment/moment.js',
    'components/handlebars/handlebars.js',
    'components/ember/ember.js',
    'components/ember-simple-auth/ember-simple-auth.js',
    'components/ember-model/ember-model.js',
    'components/ember-model-localstorage-adapter/ember-model-localstorage-adapter.js',
    'components/toastr/toastr.js',
    'components/js-md5/js/md5.js',
    'components/validator-js/validator.js',
    'components/lodash/dist/lodash.js'
  ];

  var jsMinComponents = [
    'components/jquery/dist/jquery.min.js',
    'components/moment/min/moment.min.js',
    'components/handlebars/handlebars.min.js',
    'components/ember/ember.prod.js',
    'components/ember-simple-auth/ember-simple-auth.js',
    'components/ember-model/ember-model.js',
    'components/ember-model-localstorage-adapter/ember-model-localstorage-adapter.js',
    'components/toastr/toastr.min.js',
    'components/js-md5/js/md5.min.js',
    'components/validator-js/validator.min.js',
    'components/lodash/dist/lodash.min.js'
  ];

  var jsDependencies = [
    'primus/primus.js',
    'js/animatedBorders/borderMenu.js',
    'js/animatedBorders/classie.js',
    'js/animatedBorders/modernizr.custom.js'
  ];

  var jsApp = [
    'js/app.js',
    'js/router.js',
    'js/lib/*.js',
    'js/models/*.js',
    'js/controllers/*.js'
  ];

  var jsSources = jsComponents
  .concat(jsDependencies)
  .concat(jsApp)
  .map(appendDevPublic);

  var jsMinSources = jsMinComponents
  .concat(jsDependencies)
  .concat(jsApp)
  .map(appendDevPublic);

  return gulp.src(isProdBuild ? jsMinSources : jsSources)
    .pipe(concat('build.js'))
    .pipe(gulpif(isProdBuild, uglify()))
    .pipe(size({showFiles: true}))
    .pipe(gulp.dest(DIST_PUBLIC))
    .on('error', gutil.log);
}

gulp.task('buildJS', buildJSFromSources.bind(null, false));
gulp.task('buildProdJS', buildJSFromSources.bind(null, true));
