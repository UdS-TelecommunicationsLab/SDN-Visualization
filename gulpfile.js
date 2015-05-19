var gulp = require("gulp");
var pkg = require("./package.json");

var _ = require("lodash");
var concat = require("gulp-concat");
var header = require("gulp-header");
var jshint = require("gulp-jshint");
var uglify = require("gulp-uglify");
var sourcemaps = require("gulp-sourcemaps");

var banner = "/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> \n" +
    "<%= pkg.homepage ? '* ' + pkg.homepage + '\\n' : '' %>" +
    "* Copyright (c) <%= pkg.author.name %>\n*/\n";

var frontendSources = ["aspects/**/*.module.js", "aspects/**/*.js"];
var allSources = _.union(frontendSources, ["application/**/*.js"]);

gulp.task("default", defaultTask);
gulp.task("watch", watchTask);
gulp.task("jshint", hintTask);

function defaultTask() {
    return gulp.src(frontendSources)
        .pipe(sourcemaps.init())
        .pipe(concat("dist.min.js"))
        .pipe(uglify({ mangle: false }))
        .pipe(sourcemaps.write())
        .pipe(header(banner, {pkg: pkg}))
        .pipe(gulp.dest("./public/"));
}

function watchTask() {
    gulp.watch(allSources, ["default", "jshint"]);
}

function hintTask() {
    return gulp.src(allSources)
        .pipe(jshint())
        .pipe(jshint.reporter('default'));
}