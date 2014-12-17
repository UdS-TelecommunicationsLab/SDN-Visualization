/*
 * Copyright (c) 2013 - 2014 Saarland University
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

(function(exports) {
    "use strict";
    var net = require("net"),
    config = require("../../config");

    // Primitive for sending arbitrary messages to the server, by a given communication protocol.
    var sendMessage = function (onSuccess, onError, message) {
        var configuration = config.getConfiguration();
        var connectionString = configuration.dataSource && configuration.dataSource.connectionString;
        if (connectionString) {
            var buffer = new Buffer(0, "binary");
            var socket = new net.Socket({ type: "tcp4", allowHalfOpen: true });

            if (onError) {
                socket.on("error", onError);
            }

            var address = connectionString.split(":");
            socket.connect(address[1], address[0], function () {
                socket.write(JSON.stringify(message));

                socket.on("data", function (chunk) {
                    buffer = Buffer.concat([buffer, new Buffer(chunk, "binary")]);
                });

                socket.on("end", function () {
                    if (onSuccess) {
                        onSuccess(buffer.toString("utf-8"));
                    }
                });

                socket.end();
            });
        }
    };

    exports.getInformation = function (command, onSuccess, onError) {
        var successCallback = function (data) {
            var res = {};
            try {
                res = JSON.parse(data);
            } catch (e) {
                console.log(e);
                onSuccess(null);
            }
            onSuccess(res);
        };

        sendMessage(successCallback, onError, { type: "ofcontrol", command: "v2/" + command });
    };

})(exports);