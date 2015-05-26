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

(function () {
    "use strict";
    var fs = require("fs"),
        mime = require("mime");

    var sdnc = __dirname +  "/../sdn-conf.json";
    var config = null;
    var callbacks = [];
    var sdnUiConfig = __dirname + "/../sdn-ui-conf.json";
    var sdnUiSampleConfig = __dirname + "/../sdn-ui-conf.default.json";

    var createFileIfNotExistent = function () {
        if (!fs.existsSync(sdnUiConfig)) {
            var sampleConfig = fs.readFileSync(sdnUiSampleConfig);
            fs.writeFileSync(sdnUiConfig, sampleConfig);
        }
    };

    var readConfig = function () {
        config = JSON.parse(fs.readFileSync(sdnUiConfig, {encoding: "utf-8"}));
        callbacks.forEach(function (cb) {
            cb(config);
        });
    };

    fs.watchFile(sdnUiConfig, function (curr, prev) {
        if (curr.mtime.valueOf() > prev.mtime.valueOf()) {
            createFileIfNotExistent();
            readConfig();
        }
    });

    exports.importConfig = function (request, readErrback, writeErrback, callback) {
        fs.readFile(request.files.importConfiguration.path, function (readError, data) {
            if (readError) {
                readErrback(readError, data);
                return;
            }

            fs.writeFile(sdnUiConfig, data, function (writeError) {
                if (writeError) {
                    writeErrback(writeError);
                    return;
                }

                callback();
            });
        });
    };

    exports.attachToResponse = function (response) {
        response.setHeader("Content-type", mime.lookup(sdnUiConfig));
        fs.createReadStream(sdnUiConfig).pipe(response);
    };

    exports.getConfiguration = function () {
        createFileIfNotExistent();
        if (config === null) {
            readConfig();
        }

        return config;
    };

    exports.saveConfiguration = function (configData) {
        // read ctrl config
        var sdncJson = JSON.parse(fs.readFileSync(sdnc, {encoding: "utf-8"}));
        if(sdncJson.isDemoMode){
            // in demo mode (.isDemoMode == true) rewrite old config
            var configOld = JSON.parse(fs.readFileSync(sdnUiConfig, {encoding: "utf-8"}));
            configData.dataSource.type = configOld.dataSource.type;
            configData.dataSource.connectionString = configOld.dataSource.connectionString;
            fs.writeFileSync(sdnUiConfig, JSON.stringify(configData));
            return; // and get out
        }
        fs.writeFileSync(sdnUiConfig, JSON.stringify(configData));
    };

    exports.registerHandler = function (cb) {
        callbacks.push(cb);
    };
})();