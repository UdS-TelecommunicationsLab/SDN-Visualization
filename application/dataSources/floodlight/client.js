﻿/*
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

(function (client) {
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
    }

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
    var processInfos = function (data) {
        if (data === null || data == undefined || data === {}) {
            console.error("processInfos called without data");
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
    var processSwitches = function (data) {
        if (data === null || data == undefined || data === {}) {
            console.error("processSwitches called without data");
        } else {
            model.addDevices(mapper.switches.mapAll(data));
        }

        getResource(client.commands.get.devices, processDevices);
        getResource(client.commands.get.flows, processFlows);
        getResource(client.commands.get.links, processLinks);
        getResource(client.commands.get.ports, processPorts);

        callback();
    };

    /**
     * Manipulates the model object during execution.
     *
     * @param {Object} data JSON object containing the retrieved information.
     *
     */
    var processDelay = function (data) {
        if (data === null || data == undefined || data === {}) {
            console.error("processDelay called without data");
        } else {
            data[0].delays.forEach(function(d) {
                var link = _.find(model.links, function(q) {
                    return (q.srcHost.id == d.srcdpid && q.dstHost.id == d.dstdpid) ||
                        (q.dstHost.id == d.srcdpid && q.srcHost.id == d.dstdpid);
                });
                if(link) {
                    link.delay = parseFloat(d.delayMS);
                }
            })
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
        if (data === null || data == undefined || data === {}) {
            console.error("processPacketLoss called without data");
        } else {
            data[0].packetLoss.forEach(function(d) {
                var link = _.find(model.links, function(q) {
                    return (q.srcHost.id == d.srcDpid && q.dstHost.id == d.dstDpid) ||
                        (q.dstHost.id == d.srcDpid && q.srcHost.id == d.dstDpid);
                });
                if(link) {
                    link.plr = Math.max(0, Math.min(1, 1 - (parseInt(d.dstPackets, 10) / parseInt(d.srcPackets, 10))));
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
    var processDataRate = function (data) {
        if (data === null || data == undefined || data === {}) {
            console.error("processDataRate called without data");
        } else {
            var drMax = 0;

            data[0].datarate.forEach(function(d) {
                var link = _.find(model.links, function(q) {
                    return (q.srcHost.id == d.srcDpid && q.dstHost.id == d.dstDpid) ||
                        (q.dstHost.id == d.srcDpid && q.srcHost.id == d.dstDpid);
                });
                if(link &&
                    d.lastLookup.bytesTrans != null && d.nextToLastLookup.bytesTrans != null &&
                    d.lastLookup.bytesRec != null && d.nextToLastLookup.bytesRec != null) {
                    link.drTx = (d.lastLookup.bytesTrans - d.nextToLastLookup.bytesTrans) * 8 / (d.intervall / 1000);
                    link.drRx = (d.lastLookup.bytesRec - d.nextToLastLookup.bytesRec) * 8 / (d.intervall / 1000);
                    drMax = Math.max(link.drTx, Math.max(link.drRx, drMax));
                }
            });
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
            for(var deviceId in data) {
                var device = _.find(model.devices, function(d) { return d.id === deviceId; });
                if(device && data[deviceId] != null) {
                    device.updatePorts(mapper.ports.mapAll(data[deviceId], device));
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
    var processFlows = function (data) {
        if (data == null) {
            console.error("processFlows called without data");
        } else {
            model.flows = mapper.flows.mapAll(data, model.devices);
        }

        callback();
    };

    /**
     * Manipulates the model object during execution.
     *
     * @param {Object} data JSON object containing the retrieved information.
     *
     */
    var processDevices = function (data) {
        if (data == null) {
            console.error("processDevices called without data");
        } else {
            var clientData = mapper.clients.mapAll(data, model.devices);
            model.addDevices(clientData.clients);
            model.addLinks(clientData.links);
        }

        callback();
    };

    var getResource = function (cmd, cb) {
        resourceCount++;
        intf.getInformation(cmd, cb, handleError);
    };

    client.getAllData = function (md, cb) {
        model = md;
        call = cb;
        errorRaised = false;

        getResource(client.commands.get.general, processInfos);
        getResource(client.commands.get.switches, processSwitches);
    }

    client.commands = {
        get: {
            general: "core/controller/summary/json",
            switches: "core/controller/switches/json",
            devices: "device/",
            links: "topology/links/json",
            flows: "core/switch/all/flow/json",
            ports: "core/switch/all/port/json",
            delay: "uds/statistics/delay/json",
            packetLoss: "uds/statistics/packetLoss/json",
            dataRate: "uds/statistics/dataRate/json",
        }
    };
})(exports);

