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

(function (client, DEBUG) {
    "use strict";
    var mapper = require("./mapper"),
        _ = require("lodash"),
        intf = require("./interface");

    var resourceCount = 0;
    var call = null;
    var model = null;
    var started = new Date();

    var errorRaised = false;

    var callback = function () {
        resourceCount--;
        if (resourceCount === 0) {

            if (call)
                call(errorRaised);
        }
    };

    var handleError = function (e) {
        console.log(e);
        errorRaised = true;
        callback();
    };

    /**
     * Manipulates the model object during execution.
     *
     * @param {Object} data JSON object containing the retrieved information.
     *
     */
    var processGeneral = function (data) {
        if (data === null || data == undefined || data === {}) {
            console.error("processGeneral called without data");
        } else {
            model.controller = mapper.controller.map(data);
            model.controller.started = started;
        }

        callback();
    };

    /**
     * Manipulates the model object during execution.
     *
     * @param {Object} data JSON object containing the retrieved information.
     *
     */
    var processFeatures = function (data) {
        if (data === null || data == undefined || data === {}) {
            console.error("processDesc called without data");
        } else {
            for (var deviceId in data) {
                var device = _.find(model.devices, function (d) {
                    return d.id === deviceId;
                });
                var deviceObj = data[deviceId];
                if (device && deviceObj != null) {
                    device.capabilities = deviceObj.capabilities;
                    device.actions = deviceObj.actions;
                    if (deviceObj.portDesc) {
                        var ports = {};
                        for (var i = 0; i < deviceObj.portDesc.length; i++) {
                            var port = deviceObj.portDesc[i];
                            if (port) {
                                ports[port.portNumber] = mapper.ports.map(port);
                            }
                        }
                        device.updatePorts(ports);
                    }
                }
            }
        }

        callback();
    };

    /**
     * Manipulates the model object during execution.
     *
     * @param {Object} data JSON object containing the retrieved information.
     *
     */
    var processDesc = function (data) {
        if (data === null || data == undefined || data === {}) {
            console.error("processDesc called without data");
        } else {
            for (var deviceId in data) {
                var device = _.find(model.devices, function (d) {
                    return d.id === deviceId;
                });
                if (device && data[deviceId] != null) {
                    device.description = data[deviceId].desc;
                }
            }
        }

        callback();
    };

    /**
     * Manipulates the model object during execution.
     *
     * @param {Object} data JSON object containing the retrieved information.
     *
     */
    var processSwitches = function (data) {
        if (data === null || data == undefined || data === {}) {
            console.error("processSwitches called without data");
        } else {
            model.addDevices(mapper.switches.mapAll(data));
        }

        getResource(client.commands.get.hosts, processHosts);
        getResource(client.commands.get.links, processLinks);
        getResource(client.commands.get.ports, processPorts);
        getResource(client.commands.get.desc, processDesc);

        callback();
    };

    /**
     * Manipulates the model object during execution.
     *
     * @param {Object} data JSON object containing the retrieved information.
     *
     */
    var processDelay = function (data) {
        if (data === null || data == undefined || data === {} || (data.code && data.code == 404)) {
            console.error("processDelay called without data");
        } else {
            data.forEach(function (d) {
                var srcDpid = d.srcDpid;
                var srcPort = d.srcPort;
                var dstDpid = d.dstDpid;
                var dstPort = d.dstPort;
                if(d.srcDpid > d.dstDpid) {
                    srcDpid = d.dstDpid;
                    srcPort = d.dstPort;
                    dstDpid = d.srcDpid;
                    dstPort = d.srcPort;
                }

                var links = _.filter(model.links, function (q) {
                    return q.srcHost.id == srcDpid && d.srcPort == srcPort && q.dstHost.id == dstDpid && d.dstPort == dstPort;
                });
                for(var i = 0; i < links.length; i++) {
                    links[i].delay = parseFloat(d.delayMS);
                }
            });
        }
        callback();
    };

    /**
     * Manipulates the model object during execution.
     *
     * @param {Object} data JSON object containing the retrieved information.
     *
     */
    var processPacketLoss = function (data) {
        if (data === null || data == undefined || data === {} || (data.code && data.code == 404)) {
            console.error("processPacketLoss called without data");
        } else {
            for (var deviceId in data) {
                for (var port in data[deviceId]) {
                    var plr = data[deviceId][port];

                    var srcLinks = _.filter(model.links, function (q) {
                        return (q.srcHost.id == deviceId && q.srcPort == port);
                    });

                    for (var j = 0; j < srcLinks.length; j++) {
                        srcLinks[j].srcPlr = plr;
                    }
                    var dstLinks = _.filter(model.links, function (q) {
                        return (q.dstHost.id == deviceId && q.dstPort == port);
                    });
                    for (var i = 0; i < dstLinks.length; i++) {
                        dstLinks[i].dstPlr = plr;
                    }
                }
            }
        }
        callback();
    };

    /**
     * Manipulates the model object during execution.
     *
     * @param {Object} data JSON object containing the retrieved information.
     *
     */
    var processDataRate = function (data) {
        if (data === null || data == undefined || data === {} || (data.code && data.code == 404)) {
            console.error("processDataRate called without data");
        } else {
            var drMax = 0;
            for (var deviceId in data) {
                for (var port in data[deviceId]) {
                    var interval = 5;
                    var drTx = data[deviceId][port].transmitBytes * 8 / interval;
                    var drRx = data[deviceId][port].receiveBytes * 8 / interval;

                    var srcLinks = _.filter(model.links, function (q) {
                        return (q.srcHost.id == deviceId && q.srcPort == port);
                    });

                    for (var j = 0; j < srcLinks.length; j++) {
                        srcLinks[j].srcTx = drTx;
                        srcLinks[j].srcRx = drRx;
                    }
                    var dstLinks = _.filter(model.links, function (q) {
                        return (q.dstHost.id == deviceId && q.dstPort == port);
                    });
                    for (var i = 0; i < dstLinks.length; i++) {
                        dstLinks[i].dstTx = drTx;
                        dstLinks[i].dstRx = drRx;
                    }

                    drMax = Math.max(drRx, Math.max(drTx, drMax));
                }
            }
            model._internals.drMax = drMax;
        }
        callback();
    };

    /**
     * Manipulates the model object during execution.
     *
     * @param {Object} data JSON object containing the retrieved information.
     *
     */
    var processLinks = function (data) {
        if (data == null) {
            console.error("processLinks called without data");
        } else {
            model.addLinks(mapper.links.mapAll(data, model.devices));
        }

        getResource(client.commands.get.flows, processFlows);
        getResource(client.commands.get.delay, processDelay);
        getResource(client.commands.get.packetLoss, processPacketLoss);
        getResource(client.commands.get.dataRate, processDataRate);

        callback();
    };

    /**
     * Manipulates the model object during execution.
     *
     * @param {Object} data JSON object containing the retrieved information.
     *
     */
    var processPorts = function (data) {
        if (data == null) {
            console.error("processPorts called without data");
        } else {
            for (var deviceId in data) {
                var device = _.find(model.devices, function (d) {
                    return d.id === deviceId;
                });
                if (device && data[deviceId] != null) {
                    if (data[deviceId].port) {
                        var ports = mapper.ports.mapAll(data[deviceId].port, device);
                        device.updatePorts(ports);
                    }
                }
            }
        }

        getResource(client.commands.get.features, processFeatures);

        callback();
    };

    /**
     * Manipulates the model object during execution.
     *
     * @param {Object} data JSON object containing the retrieved information.
     *
     */
    var processFlows = function (data) {
        if (data == null) {
            console.error("processFlows called without data");
        } else {
            model.flows = mapper.flows.mapAll(data, model.devices, model.links);
        }

        callback();
    };

    /**
     * Manipulates the model object during execution.
     *
     * @param {Object} data JSON object containing the retrieved information.
     *
     */
    var processHosts = function (data) {
        if (data == null) {
            console.error("processHosts called without data");
        } else {
            var clientData = mapper.clients.mapAll(data, model.devices);
            model.addDevices(clientData.clients);
            model.addLinks(clientData.links);
        }

        callback();
    };

    var getResource = function (cmd, cb) {
        var callback = cb;
        if (DEBUG) {
            var now = new Date();
            callback = function (d) {
                console.log("[Worker] " + cmd + " took " + ((new Date().getTime() - now.getTime()) / 1000) + " seconds.");
                cb(d);
            };
        }
        resourceCount++;
        intf.getInformation(cmd, callback, handleError);
    };

    client.getAllData = function (md, cb) {
        model = md;
        call = cb;
        errorRaised = false;

        getResource(client.commands.get.general, processGeneral);
        getResource(client.commands.get.switches, processSwitches);
    };

    client.commands = {
        get: {
            general: "core/controller/summary/json",
            switches: "core/controller/switches/json",
            hosts: "device/",
            links: "topology/links/json",
            flows: "core/switch/all/flow/json",
            ports: "core/switch/all/port/json",
            desc: "core/switch/all/desc/json",
            features: "core/switch/all/features/json",
            delay: "uds/delay/json",
            packetLoss: "uds/statistics/packetloss/json",
            dataRate: "uds/statistics/datarate/json"
        }
    };
})(exports, false);

