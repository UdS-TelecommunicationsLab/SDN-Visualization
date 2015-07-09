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

(function (logging, DEBUG) {
    "use strict";
    var webSocket = require("ws"),
        nodeSockets = require("./nodeSockets"),
        config = require("../sdn-ui-conf");
    var liveLogServer;
    var ws;

    logging.init = init;
    logging.initializeLiveLog = initializeLiveLog;
    logging.handleRegisterReq = handleRegisterReq;

    /////////////
    function init() {
        var host = config.dataSource.host || "localhost";
        var port = config.dataSource.ports && config.dataSource.ports.wsAPI || 1000;
        liveLogServer = "ws://" + host + ':' + port;
        if (DEBUG) {
            console.log(JSON.stringify(config));
            console.log(liveLogServer);
        }
        ws = new webSocket(liveLogServer);
        initializeLiveLog();
    }

    function initializeLiveLog() {
        ws.on("error", function (e) {
            console.log("WebSocket connection to Controller could not be created. Change the information inside the configuration page and restart application.");
            console.log(e);
        });
        ws.on('open', function open() {
            if (DEBUG) {
                console.log("LiveLog Socket: opened.");
            }

            handleRegisterReq(function () {
                if (DEBUG) {
                    console.log("LiveLog Socket: registered");
                }
            });
        });

        ws.on('message', function (data) {
            if (DEBUG) {
                console.log(data);
            }
            nodeSockets.publish("/logging/update", data);
        });
    }

    function handleRegisterReq(callback) {
        var msg = 'register';
        if (DEBUG) {
            console.log("Sending " + msg + " to " + liveLogServer);
        }

        ws.send(msg);
        callback({success: true});
    }
})(exports, false);
