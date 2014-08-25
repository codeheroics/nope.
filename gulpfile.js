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

var DEV_PUBLIC = './public';
var DIST_PUBLIC = './public_dist';

function appendDevPublic (src) {
  return DEV_PUBLIC + '/' + src;
}

gulp.task('default', function() {
  // place code for your default task here
});

gulp.task('build', ['buildHTML', 'buildJS', 'buildCSS']);

gulp.task('buildHTML', function() {
  gulp.src(DEV_PUBLIC + '/app.html')
    .pipe(useref())
    .pipe(minifyHTML({ conditionals: true })) // IE conditionals remain
    .pipe(size({showFiles: true}))
    .pipe(gulp.dest(DIST_PUBLIC))
    .on('error', gutil.log);
});

gulp.task('buildJS', function() {
  var jsComponents = [
    'components/jquery/dist/jquery.js',
    'components/moment/moment.js',
    'components/handlebars/handlebars.js',
    'components/ember/ember.js',
    'components/ember-simple-auth/ember-simple-auth.js',
    'components/ember-model/ember-model.js',
    'components/ember-model-localstorage-adapter/ember-model-localstorage-adapter.js',
    'components/toastr/toastr.js',
    'components/js-md5/js/md5.js'
  ];

  var jsDependencies = [
    'primus/primus.js',
    'js/animatedBorders/borderMenu.js',
    'js/animatedBorders/classie.js',
    'js/animatedBorders/modernizr.custom.js',
    'js/skel.min.js'
  ];

  var jsApp = [
    'js/app.js',
    'js/router.js',
    'js/lib/*.js',
    'js/models/*.js',
    'js/controllers/*.js'
  ];

  var sources = jsComponents
  .concat(jsDependencies)
  .concat(jsApp)
  .map(appendDevPublic);

  return gulp.src(sources)
    .pipe(concat('build.js'))
    .pipe(gulp.dest(DIST_PUBLIC))
    .pipe(size({showFiles: true}))
    .pipe(uglify())
    .pipe(rename('build.min.js'))
    .pipe(size({showFiles: true}))
    .pipe(gulp.dest(DIST_PUBLIC))
    .on('error', gutil.log);
});

gulp.task('buildCSS', function() {
  var cssComponents = [
  'components/toastr/toastr.css',
  'components/font-awesome/css/font-awesome.css'
  ];

  var cssDependencies = [
    'css/fonts.css',
    'css/style.css',
    'css/style2.css',
    'css/style-desktop.css',
    'css/style-mobile.css',
    'css/style-1000px.css'
  ];

  var cssDir = DIST_PUBLIC + '/css';

  var sources = cssComponents.concat(cssDependencies).map(appendDevPublic);

  var css = gulp.src(sources)
    .pipe(concat('build.css'))
    .pipe(size({showFiles: true}))
    .pipe(gulp.dest(cssDir))
    .pipe(minifyCSS())
    .pipe(rename('build.min.css'))
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

gulp.task('clean', function (cb) {
  rimraf(DIST_PUBLIC, cb);
});
