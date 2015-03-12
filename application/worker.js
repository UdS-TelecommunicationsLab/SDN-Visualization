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

(function(DEBUG) {
    "use strict";
    var dataSource = require(__dirname + "/dataSources/source"),
        config = require(__dirname + "/ui-config"),
        moment = require("moment"),
        objectDiff = require(__dirname + "/../lib/objectDiff-enhanced/objectDiff"),
        nvm = require(__dirname + "/../public/shared/NVM");

    var pollingDelay = 1500; // in milliseconds
    var model = new nvm.NVM();
    var oldModel = model;
    var reset = false;
    var started = new Date();

    var finish = function (errorRaised) {
        if (!errorRaised) {
            model.latestUpdate = new Date();
            if (model.controller) {
                model.controller.isReachable = true;
            }
        } else {
            if (model.controller) {
                model.controller.isReachable = false;
            }
        }

        var changes = objectDiff.diff(oldModel, model);

        process.send({ model: model, changes: changes });

        oldModel = model;
        if(reset) {
            DEBUG && console.log("[Worker] Reset NVM."); // jshint ignore:line
            model = new nvm.NVM(model.started);
            reset = false;
        } else {
            model = new nvm.NVM(oldModel.started, oldModel);
        }

        var now = new Date();
        var diffMs = (now.getTime() - started.getTime());
        DEBUG && console.log("[Worker] Run finished on " + moment(now).format("dddd, MMMM Do YYYY, HH:mm:ss") + ". Took " + (diffMs/1000) + " seconds."); // jshint ignore:line

        var timeToWait = Math.max(pollingDelay - diffMs, 0);
        setTimeout(loadingProcess, timeToWait);
    };

    var isAvailable = function () {
        var configuration = config.getConfiguration();
        return (configuration && configuration.dataSource && configuration.dataSource.type && configuration.dataSource.connectionString) ? true : false;
    };

    var loadingProcess = function() {
        started = new Date();
        DEBUG && console.log("[Worker] Run started on " + moment(started).format("dddd, MMMM Do YYYY, HH:mm:ss") + "."); // jshint ignore:line
        try {
            if (isAvailable()) {
                dataSource.getAllData(model, finish);
            } else {
                setTimeout(loadingProcess, pollingDelay);
            }
        } catch (e) {
            DEBUG && console.log("[Worker] " + e); // jshint ignore:line
        }
    };

    process.on("message", function(m) {
        // starting the worker
        if (m && m.start) {
            var configuration = config.getConfiguration();
            dataSource.init(configuration.dataSource);

            loadingProcess();
        }

        if (m && m.reset) {
            DEBUG && console.log("[Worker] Received request to reset NVM."); // jshint ignore:line
            reset = true;
        }
    });
})(false);