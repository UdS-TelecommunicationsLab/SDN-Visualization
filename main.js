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

"use strict";
var path = require("path"),
    passport = require("passport"),
    server = require("./application/nodeServer"),
    router = require("./application/nodeRouter"),
    security = require("./application/security"),
    pkg = require("./package.json"),
    lessMiddleware = require("less-middleware"),
    express = require("express");

var app = module.exports = express();

app.set("port", process.env.PORT || pkg.appPort || 3000);
app.set("redirect", pkg.isHttpRedirectEnabled);
app.set("views", __dirname + "/aspects");
app.set("view engine", "jade");
app.use(express.cookieParser());
app.use(lessMiddleware({ src: __dirname + "/public", compress: true }));
//app.use(express.logger("dev"));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use("/lib", express.static(path.join(__dirname, "lib")));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.session({ secret: "df34<ajdrf9364aherf0�q34a<rh" }));
app.use(passport.initialize());
app.use(passport.session());
app.use(app.router);

if (app.get("env") === "development") {
    app.use(express.errorHandler());
}
if (app.get("env") === "production") {
}

security.init();
router.init(app);
server.init(app);