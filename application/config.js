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

(function() {
    "use strict";
    var fs = require("fs"),
        mime = require("mime");

    var config = null;
    var callbacks = [];
    var sdnConfig = __dirname + "/../sdn-conf.json";
    var sdnSampleConfig = __dirname + "/../sdn-conf.default.json";

    var createFileIfNotExistent = function () {
        if (!fs.existsSync(sdnConfig)) {
            var sampleConfig = fs.readFileSync(sdnSampleConfig);
            fs.writeFileSync(sdnConfig, sampleConfig);
        }
    };

    var readConfig = function () {
        config = JSON.parse(fs.readFileSync(sdnConfig, { encoding: "utf-8" }));
        callbacks.forEach(function (cb) { cb(config); });
    };

    fs.watchFile(sdnConfig, function (curr, prev) {
        if (curr.mtime.valueOf() > prev.mtime.valueOf()) {
            createFileIfNotExistent();
            readConfig();
        }
    });

    exports.getConfiguration = function () {
        createFileIfNotExistent();
        if (config == null) {
            readConfig();
        }

        return config;
    };

    exports.registerHandler = function (cb) {
        callbacks.push(cb);
    };
})();