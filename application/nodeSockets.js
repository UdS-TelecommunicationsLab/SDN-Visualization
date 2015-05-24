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

(function (nodeSockets) {
    "use strict";
    var config = require("./ui-config"),
        io = require("socket.io"),
        msgpack = require('../lib/msgpack-javascript/msgpack.codec.js').msgpack;

    var connection;
    var worker;

    var handleSaveVizConfiguration = function (message, callback) {
        // TODO: this method needs some kind of validity check for the sent configuration
        config.saveConfiguration(message.configuration);
        callback({ success: true });
    };

    var handleNvmReset = function (message, callback) {
        worker.send({reset: true});
        callback({success: true});
    };

    var registerHandles = function () {
        config.registerHandler(function (config) {
            nodeSockets.publishConfigUpdate(config);
        });

        connection.on("connection", function (socket) {
            socket.on("/interact/saveVizConfiguration", handleSaveVizConfiguration);
            socket.on("/nvm/reset", handleNvmReset);
        });
    };

    nodeSockets.setWorker = function (lclWorker) {
        worker = lclWorker;
    };

    var publish = function (channel, message) {
        connection.emit(channel, message);
    };

    nodeSockets.publishModelUpdate = function (changes, checksum) {
        publish("/modelUpdate", {diff: msgpack.pack(changes, true), checksum: checksum});
    };

    nodeSockets.publishConfigUpdate = function (configuration) {
        publish("/configUpdate", {configuration: configuration});
    };

    nodeSockets.bind = function (server) {
        connection = io.listen(server, {log: false}).sockets;
        registerHandles();
        console.log("Websockets initalized.");
    };
})(exports);