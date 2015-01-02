/*
 * Copyright (c) 2013 - 2015 Saarland University
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * Contributor(s): Andreas Schmidt (Saarland University), Michael Karl (Saarland University)
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 * 
 * This license applies to all parts of the SDN-Visualization Application that are not externally
 * maintained libraries. The licenses of externally maintained libraries can be found in /licenses.
 */

module.exports = function(grunt) {
    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON("package.json"),
        banner: "/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - " +
            "<%= grunt.template.today('yyyy-mm-dd') %>\\n" +
            "<%= pkg.homepage ? '* ' + pkg.homepage + '\\n' : '' %>" +
            "* Copyright (c) <%= grunt.template.today('yyyy') %> <%= pkg.author.name %>;" +
            " Licensed <%= _.pluck(pkg.licenses, 'type').join(', ') %> */\n",
        jshint: {
            options: {
                curly: true,
                eqeqeq: true,
                immed: true,
                latedef: true,
                newcap: true,
                noarg: true,
                sub: true,
                undef: true,
                unused: true,
                boss: true,
                eqnull: true,
                globals: {
                    exports: true,
                    require: true,
                    process: true,
                    console: true,
                    setTimeout: true,
                    Buffer: true,
                    window: true
                }
            },
            gruntfile: {
                src: "Gruntfile.js"
            },
            lib_test: {
                src: [
                    "application/**/*.js",
                    "public/shared/**/*.js"
                ]
            }
        },
		compress: {
			main: {
				options: {
					archive: function() {
						var d = new Date();
						var date = d.toISOString().slice(0,19).replace(/[-:]/g,"").replace(/T/g, "_");
						return "../SDN-Viz_" + date + ".zip";
					}
				},
				expand: true,
				cwd: "./",
				src: [
					"application/**/*",
					"licenses/**/*",
					"public/**/*",
					"shared/**/*",
					"test/**/*",
					"views/**/*",
					"worker/**/*",
					"*.*"
				],
				dest: "./"
			}
			
		},
        concat: {
            options: {
                banner: '<%= banner %>',
                stripBanners: true
            },
            dist: {
                src: ['aspects/**/*.js'],
                dest: 'public/js/dist.js'
            }
        },
        karma: {
            unit: {
                configFile: "sdnViz.conf.js",
                runnerPort: 9999,
                singleRun: true,
                browsers: ['PhantomJS']
            }
        },
        uglify: {
            options: {
                mangle: false
            },
            my_target: {
                files: {
                    "public/js/dist.min.js": ["public/js/dist.js"]
                }
            }
        },
        watch: {
            files: "aspects/**/*.js",
            tasks: ["concat", "uglify"],
            options: {
                interrupt: true
            }
        }
    });

    grunt.loadNpmTasks("grunt-karma");
	grunt.loadNpmTasks("grunt-contrib-compress");
    grunt.loadNpmTasks("grunt-contrib-concat");
    grunt.loadNpmTasks("grunt-contrib-jshint");
    grunt.loadNpmTasks("grunt-contrib-uglify");
    grunt.loadNpmTasks("grunt-contrib-watch");

    grunt.registerTask("test", ["karma"]);

    grunt.registerTask("hint", ["jshint"]);

    grunt.registerTask("default", ["concat", "uglify"]);
	
	grunt.registerTask("dist", ["default", "compress"]);
};