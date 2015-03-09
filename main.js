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
 * maintained libraries. The licenses of externally maintained libraries can be found in /node_modules and /lib.
 */

"use strict";
var bodyParser = require("body-parser"),
    cookieParser = require("cookie-parser"),
    express = require("express"),
    lessMiddleware = require("less-middleware"),
    methodOverride = require("method-override"),
    errorhandler = require("errorhandler"),
    flash = require("connect-flash"),
    path = require("path"),
    passport = require("passport"),
    pkg = require("./package.json"),
    router = require("./application/nodeRouter"),
    security = require("./application/security"),
    session = require("express-session"),
    server = require("./application/nodeServer");

var app = module.exports = express();

app.set("port", process.env.PORT || pkg.appPort || 3000);
app.set("redirect", pkg.isHttpRedirectEnabled);
app.set("views", __dirname + "/aspects");
app.set("view engine", "jade");
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(methodOverride());
app.use(lessMiddleware({src: __dirname + "/public", compress: true}));
//app.use(express.logger("dev"));
app.use("/lib", express.static(path.join(__dirname, "lib")));
app.use(express.static(path.join(__dirname, "public")));
app.use(session({
    secret: "df34<ajdrf9364aherf0üqq34a<rh",
    cookie: {secure: true},
    saveUninitialized: true, resave: true, expires: false
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

if (app.get("env") === "development") {
    app.use(errorhandler());
}
if (app.get("env") === "production") {
}

security.init();
router.init(app);
server.init(app);