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

(function(sdnViz) {
    "use strict";
    sdnViz.factory("repository", function($rootScope, $http, toastr, websockets, messenger) {
        var data = { nvm: null, logs: [] };

        // Data Context Functions
        var getDeviceById = function(id) {
            var device = _.find(data.nvm.devices, function(e) {
                return e.id == id;
            });

            var connectedDevices = {};
            if (device) {
                var links = _.filter(data.nvm.links, function(d) {
                    return d.srcHost.id == device.id || d.dstHost.id == device.id;
                });
                connectedDevices = _.object(_.map(links, function(d) {
                    if (d.srcHost.id == device.id)
                        return [d.srcPort, d.dstHost];
                    else {
                        return [d.dstPort, d.srcHost];
                    }
                }));
            }
            return { item: device, connectedDevices: connectedDevices };
        };

        var getLinkById = function(id) {
            var link = _.find(data.nvm.links, function(e) {
                return e.id == id;
            });

            return { item: link };
        };

        var getFlowById = function(id) {
            var flow = _.find(data.nvm.flows, function(e) {
                return e.id == id;
            });

            return { item: flow };
        };

        // Change Management
        var copyCleanModel = function(obj) {
            var res;
            if (_.isArray(obj)) {
                res = [];
                for (var i = 0; i < obj.length; i++) {
                    res.push(copyCleanModel(obj[i]));
                }
            } else if (_.isObject(obj)) {
                res = {};
                var keys = _.keys(obj);
                for (var j = 0; j < keys.length; j++) {
                    var a = keys[j];
                    if(a !== "$$hashKey"){
                        res[a] = copyCleanModel(obj[a]);
                    }
                }
            } else {
                res = obj;
            }

            return res;
        };

        var update = function(message, model) {
            $rootScope.status.controller = model.controller && model.controller.isReachable;
            $rootScope.lastUpdate = model.latestUpdate;
            $rootScope.isStandalone = true;

            $rootScope.serverCRC = message.checksum;
            $rootScope.localCRC = sdn.hashCode(model);

            if (model.controller && model.controller.isReachable) {
                $rootScope.contactInformation = model.controller.contact;
                $rootScope.isStandalone = model.controller.isStandalone;
            }

            $rootScope.status.noDivergence = ($rootScope.serverCRC === $rootScope.localCRC);

            return $rootScope.status.noDivergence;
        };

        var updateStatus = function() {
            $rootScope.systemError = "";

            var newStatus = _.reduce(_.values($rootScope.status), function(memo, n) { return memo && n; }, true);

            if ($rootScope.totalStatus && !newStatus) {
                $rootScope.systemErrorStamp = new Date();

                if (!$rootScope.status.controller) {
                    $rootScope.systemError = "Controller cannot be reached.";
                }
                if (!$rootScope.status.transport) {
                    $rootScope.systemError = "Client lost connection to server.";
                }
                if (!$rootScope.status.noDivergence) {
                    $rootScope.systemError = "Local model diverged.";
                }

                data.logs.splice(0, 0, new Log($rootScope.systemErrorStamp, $rootScope.systemError, 'error'));
            }

            if (!$rootScope.totalStatus && newStatus) {
                data.logs.splice(0, 0, new Log(new Date(), "Running smooth again. Errors fixed.", ''));
            }

            $rootScope.totalStatus = newStatus;

            if (!$rootScope.status.noDivergence) {
                load();
            }
        };

        var Log = function(date, message, status) {
            this.date = date || new Date();
            this.message = message;
            this.status = status;
        };

        var clearLog = function() {
            data.logs.length = 0;
        };

        var load = function() {
            $http.get("/api/model?d=" + new Date()).
                success(function(compressedData, status, headers, config) {
                    var originalData = msgpack.unpack(compressedData.data);
                    data.nvm = originalData.nvm;
                    update(originalData, originalData.nvm);

                    messenger.publish("modelUpdate", originalData);

                    registerUpdate();
                }).
                error(function(data, status, headers, config) {
                    toastr.danger("Error while fetching model.");
                });
        };

        var loaded = false;
        var registerUpdate = function() {
            if (!loaded) {
                websockets.subscribeModelUpdate(function(message) {
                    objectDiff.applyChanges(data.nvm, message.changes);
                    var success = update(message, copyCleanModel(data.nvm));
                    if (success) {
                        messenger.publish("modelUpdateDiff", message);
                    }
                });
                loaded = true;
            }
        };

        var init = function() {
            $rootScope.status = {
                controller: true,
                transport: true,
                noDivergence: true,
            };
            $rootScope.totalStatus = true;
            $rootScope.isStandalone = true;

            data.logs.push(new Log(new Date(), "Client started.", ''));

            $rootScope.$watch("status.controller", updateStatus);
            $rootScope.$watch("status.transport", updateStatus);
            $rootScope.$watch("status.noDivergence", updateStatus);

            $rootScope.contactInformation = "";
            $rootScope.systemError = "";

            load();
        };

        return {
            getDeviceById: getDeviceById,
            getLinkById: getLinkById,
            getFlowById: getFlowById,
            data: data,
            applyChanges: objectDiff.applyChanges,
            clearLog: clearLog,
            init: init
        };
    });
})(window.sdnViz);