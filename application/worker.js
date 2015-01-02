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

(function(DEBUG) {
    "use strict";
    var dataSource = require("../application/dataSources/source"),
        config = require("./config"),
        objectDiff = require("../lib/objectDiff-enhanced/objectDiff"),
        nvm = require("../public/shared/NVM");

    var pollingDelay = 1500; // in milliseconds
    var model = new nvm.NVM();
    var oldModel = model;

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
        model = new nvm.NVM(oldModel.started, oldModel);
        model.latestInteraction = oldModel.latestInteraction;
        setTimeout(loadingProcess, pollingDelay);
    };

    var isAvailable = function () {
        var configuration = config.getConfiguration();
        return (configuration && configuration.dataSource && configuration.dataSource.type && configuration.dataSource.connectionString) ? true : false;
    };

    var loadingProcess = function() {
        DEBUG && console.log("Worker run started.");
        try {
            if (isAvailable()) {
                dataSource.getAllData(model, finish);
            } else {
                setTimeout(loadingProcess, pollingDelay);
            }
        } catch (e) {
            DEBUG && console.log(e);
        }
    };

    process.on("message", function(m) {
        // starting the worker
        if (m && m.start) {
            var configuration = config.getConfiguration();
            dataSource.init(configuration.dataSource);

            loadingProcess();
        }

        // updating latestInteraction information
        if (m && m.latestInteraction) {
            oldModel.latestInteraction = m.latestInteraction;
        }
    });
})(false);