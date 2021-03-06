﻿/*
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
 * Contributor(s): Andreas Schmidt (Saarland University), Philipp S. Tennigkeit (Saarland University), Michael Karl (Saarland University)
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
 * maintained libraries. The licenses of externally maintained libraries can be found in /node_modules and /lib.
 */

(function (security) {
    "use strict";
    var passport = require("passport"),
        fs = require("fs"),
        moment = require("moment"),
        LocalStrategy = require("passport-local").Strategy;

    var conf = require("./config").getConfiguration();

    var name = (conf.credentials && conf.credentials.name) || "root";
    var pass = (conf.credentials && conf.credentials.pass) || "sdn";

    var logFile = __dirname + "/../security.log";

    security.init = function () {
        fs.open(logFile, "a", function() {
        });
        passport.use(new LocalStrategy({
                passReqToCallback: true
            },
            function (req, enteredName, enteredPass, done) {
                if (enteredName === name && enteredPass === pass) {
                    var logEntry = moment().format() + "\t" + req.ip + "\t" + name + "\n";
                    fs.appendFileSync(logFile, logEntry);
                    done(null, {name: name});
                } else {
                    done(null, false, req.flash("loginMessage", "Incorrect username or password."));
                }
            }));

        passport.serializeUser(function (user, done) {
            done(null, user.name);
        });

        passport.deserializeUser(function (id, done) {
            return done(null, id);
        });
    };
})(exports);