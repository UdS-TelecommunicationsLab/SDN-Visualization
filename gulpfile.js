(function () {
    "use strict";

    var gulp = require("gulp");
    var args = require("yargs").argv;
    var pkg = require("./package.json");
    var config = require("./gulp.config")();

    var _ = require("lodash");
    var $ = require("gulp-load-plugins")({lazy: true});

    var banner = "/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> \n" +
        "<%= pkg.homepage ? '* ' + pkg.homepage + '\\n' : '' %>" +
        "* Copyright (c) <%= pkg.author.name %>\n*/\n";

    var frontendSources = ["aspects/**/*.module.js", "aspects/**/*.js"];
    var allSources = _.union(frontendSources, ["application/**/*.js"]);

    gulp.task("help", $.taskListing);
    gulp.task("default", ["help"]);
    gulp.task("build", buildTask);
    gulp.task("watch", watchTask);
    gulp.task("jshint", hintTask);
    gulp.task("bump", bumpTask);

    ///////////// Tasks
    function buildTask() {
        return gulp.src(frontendSources)
            .pipe($.sourcemaps.init())
            .pipe($.concat("dist.min.js"))
            .pipe($.uglify({ mangle: false }))
            .pipe($.sourcemaps.write())
            .pipe($.header(banner, {pkg: pkg}))
            .pipe(gulp.dest("./public/"));
    }

    function watchTask() {
        gulp.watch(allSources, ["default", "jshint"]);
    }

    function hintTask() {
        return gulp.src(allSources)
            .pipe($.jshint())
            .pipe($.jshint.reporter('default'));
    }

    function bumpTask() {
        var msg = "Bumping versions";
        var type = args.type;
        var version = args.version;
        var options = {};
        if (version) {
            options.version = version;
            msg += " to " + version;
        } else {
            options.type = type;
            msg += " for a " + type;
        }
        log(msg);

        return gulp
            .src(config.packages)
            .pipe($.print())
            .pipe($.bump(options))
            .pipe(gulp.dest(config.root));
    }

    ///////////// Helpers
    function log(msg) {
        if (typeof(msg) === "object") {
            for (var item in msg) {
                if (msg.hasOwnProperty(item)) {
                    $.util.log($.util.colors.blue(msg[item]));
                }
            }
        } else {
            $.util.log($.util.colors.blue(msg));
        }
    }
})();
