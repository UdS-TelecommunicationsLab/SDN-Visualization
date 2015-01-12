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

(function(nodeServer) {
    "use strict";
    var fs = require("fs"),
        express = require("express"),
        net = require("net"),
        http = require("http"),
        https = require("https"),
        nodeSockets = require("./nodeSockets"),
        storage = require("./storage");

    var registerRedirect = function(app) {
        var httpApp = express();
        httpApp.get("*", function(req, res) {
            res.redirect("https://" + req.headers.host + ":" + app.get("port") + req.url);
        });

        var httpListenHandler = net.createServer().listen(80, function(e) {
            http.createServer(httpApp).listen(httpListenHandler);
        });
    };

    var startWorker = function() {
        var worker = require("child_process").fork("application/worker.js");

        worker.on("exit", function() {
            console.log("Worker process terminated. Trying to restart.");
            startWorker();
        });

        worker.on("message", function(response) {
            storage.setNVM(response.model);
            nodeSockets.publishModelUpdate(response.changes, storage.getChecksum());
        });

        nodeSockets.setWorker(worker);
        worker.send({ start: true });

        console.log("Worker started.");
    };

    nodeServer.init = function(app) {
        if (app.get("redirect")) {
            registerRedirect(app);
        }

        var server = https.createServer({
            key: fs.readFileSync('./cert/key.pem'),
            cert: fs.readFileSync('./cert/cert.pem'),
            rejectUnauthorized: false
        }, app);

        server.listen(app.get("port"), function() {
            console.log("Server listening on port " + app.get("port") + ".");

            startWorker();
            nodeSockets.bind(server);
        });
    };
})(exports);