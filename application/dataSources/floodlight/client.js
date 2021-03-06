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

/* jshint node:true */
(function (client, DEBUG) {
    "use strict";
    var mapper = require("./mapper"),
        _ = require("lodash"),
        request = require("request"),
        intf = require("./interface");

    var resourceCount = 0;
    var call = null;
    var model = null;
    var started = new Date();

    var errorRaised = false;

    var callback = function () {
        resourceCount--;
        if (resourceCount === 0) {
            if (call) {
                call(errorRaised);
            }
        }
    };

    var findDevice = function (deviceId) {
        return function (d) {
            return d.id === deviceId;
        };
    };

    var findSrcHostAndPort = function (deviceId, port) {
        return function (q) {
            return (q.srcHost.id === deviceId && q.srcPort === port);
        };
    };
    var findDstHostAndPort = function (deviceId, port) {
        return function (q) {
            return (q.dstHost.id === deviceId && q.dstPort === port);
        };
    };

    var findLink = function (srcId, srcPort, dstId, dstPort) {
        return function (q) {
            return (q.srcHost.id === srcId && q.srcPort === srcPort && q.dstHost.id === dstId && q.dstPort === dstPort);
        };
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
        if (data === null || data === undefined || data === {}) {
            console.error("processGeneral called without data");
        } else {
            model.controller = mapper.controller.map(data);
            model.controller.started = started;
        }

        getResource(client.commands.get.routing, processRouting);
        getResource(client.commands.get.relaying, processRelaying);

        callback();
    };

    /**
     * Manipulates the model object during execution.
     *
     * @param {Object} data JSON object containing the retrieved information.
     *
     */
    var processRelaying = function (data) {
        if (data === null || data === undefined || data === {}) {
            console.error("processRelaying called without data");
        } else {
            // initialize model
            model.controller.relaying.tcp.enabled = data.tcp.enabled;
            model.controller.relaying.udp.enabled = data.udp.enabled;
            model.controller.relaying.tcp.count = data.tcp.count;
            model.controller.relaying.udp.count = data.udp.count;

            // trigger inserting the filters
            getResource(client.commands.get.relayingUDP, getProcessRelayingFunction("udp"));
            getResource(client.commands.get.relayingTCP, getProcessRelayingFunction("tcp"));
        }
        callback();
    };

    var getProcessRelayingFunction = function(protocol) {
        return function(data) {
            if (data === null || data === undefined || data === {}) {
                console.error("processRelaying called without data");
            } else {
                requestRelays(data, protocol);
            }
            callback();
        };
    };

    /**
     * Manipulates the model object during execution.
     *
     * @param {Object} data JSON object containing the retrieved information.
     *
     */
    var requestRelays = function (data, transport) {
        data.forEach(function (filterData) {
            var url = "uds/relaying/" + transport + "/" + filterData.filterIP + "/" + filterData.filterPort + "/json";
            getResource(url, function (relayData) {
                if (relayData === null || relayData === undefined || relayData === {}) {
                    console.log("requestRelays did not return useful data for individual relays");
                } else {
                    var relay = {
                        filterIP: filterData.filterIP,
                        filterPort: filterData.filterPort,
                        relayIP: relayData.relayip,
                        relayMAC: relayData.relaymac,
                        switchDPID: relayData.swdpid,
                        switchPort: relayData.swport,
                        transportPort: relayData.transportport,
                        enabled: relayData.enabled
                    };
                    if (transport === "tcp") {
                        model.controller.relaying.tcp.relays.push(relay);
                    } else if (transport === "udp") {
                        model.controller.relaying.udp.relays.push(relay);
                    }
                }
                callback();
            });
        });
    };

    /**
     * Manipulates the model object during execution.
     *
     * @param {Object} data JSON object containing the retrieved information.
     *
     */
    var processRouting = function (data) {
        if (data === null || data === undefined || data === {}) {
            console.error("processRouting called without data");
        } else {
            var parseMetrics = function (metric) {
                if (metric == "CONSTANT") {
                    return "Constant";
                } else if (metric == "LOW_DELAY") {
                    return "Low Delay";
                }
            };

            model.controller.routing.availableMetrics = _.map(data.availablemetrics, parseMetrics);
            model.controller.routing.currentMetric = parseMetrics(data.currentdefault);
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
        if (data === null || data === undefined || data === {}) {
            console.error("processFeatures called without data");
        } else {
            var deviceIds = _.keys(data);
            for (var i = 0; i < deviceIds.length; i++) {
                var deviceId = deviceIds[i];
                var device = _.find(model.devices, findDevice(deviceId));
                var deviceObj = data[deviceId];
                if (device && deviceObj !== null) {
                    device.capabilities = deviceObj.capabilities || "";
                    device.actions = deviceObj.actions || "";
                    if (deviceObj.portDesc) {
                        var ports = {};
                        for (var j = 0; j < deviceObj.portDesc.length; j++) {
                            var port = deviceObj.portDesc[j];
                            if (port && port.portNumber !== "local") {
                                var portNumber = parseInt(port.portNumber, 10);
                                ports[portNumber] = mapper.ports.map(port);
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
        if (data === null || data === undefined || data === {}) {
            console.error("processDesc called without data");
        } else {
            for (var deviceId in data) {
                var device = _.find(model.devices, findDevice(deviceId));
                if (device && data[deviceId] !== null) {
                    device.description = data[deviceId].desc || "";
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
        if (data === null || data === undefined || data === {}) {
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
        if (data === null || data === undefined || data === {} || (data.code && data.code === 404)) {
            console.error("processDelay called without data");
        } else {
            var delays = data;
            for (var k = 0; k < delays.length; k++) {
                var delaySample = delays[k];
                // Sw1-Sw2 = C-Sw1-Sw2-C - 0.5*(C-Sw1-C + C-Sw2-C)
                var delay = (delaySample.inconsistency) ? null : (delaySample.fullDelay - 0.5 * (delaySample.srcCtrlDelay + delaySample.dstCtrlDelay));
                var srcPort = parseInt(delaySample.srcPort, 10);
                var dstPort = parseInt(delaySample.dstPort, 10);
                var deviation = delaySample.fullDeviation + (delaySample.srcCtrlDeviation + delaySample.dstCtrlDeviation)*0.5;

                var srcLinks = _.filter(model.links, findLink(delaySample.srcDpid, srcPort, delaySample.dstDpid, dstPort));
                for (var i = 0; i < srcLinks.length; i++) {
                    srcLinks[i].srcDelay = delay;
                    srcLinks[i].srcDeviation = deviation;
                }

                var dstLinks = _.filter(model.links, findLink(delaySample.dstDpid, dstPort, delaySample.srcDpid, srcPort));
                for (var j = 0; j < dstLinks.length; j++) {
                    dstLinks[j].dstDelay = delay;
                    dstLinks[j].dstDeviation = deviation;
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
    var processPacketLoss = function (data) {
        if (data === null || data === undefined || data === {} || (data.code && data.code === 404)) {
            console.error("processPacketLoss called without data");
        } else {
            for (var deviceId in data) {
                if (data[deviceId]) {
                    var device = data[deviceId];
                    for (var port in device) {
                        if (device[port] !== undefined) {
                            var portNumber = parseInt(port, 10);
                            var plr = device[port];

                            var srcLinks = _.filter(model.links, findSrcHostAndPort(deviceId, portNumber));
                            for (var j = 0; j < srcLinks.length; j++) {
                                srcLinks[j].srcPlr = plr;
                            }

                            var dstLinks = _.filter(model.links, findDstHostAndPort(deviceId, portNumber));
                            for (var i = 0; i < dstLinks.length; i++) {
                                dstLinks[i].dstPlr = plr;
                            }
                        }
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
        if (data === null || data === undefined || data === {} || (data.code && data.code === 404)) {
            console.error("processDataRate called without data");
        } else {
            var drMax = 0;
            for (var deviceId in data) {
                if (data[deviceId]) {
                    var device = data[deviceId];
                    for (var port in device) {
                        if (device[port] !== undefined) {
                            var portNumber = parseInt(port, 10);

                            var interval = 5; // TODO: replace with proper interval
                            var drTx = device[port].transmitBytes * 8 / interval;
                            var drRx = device[port].receiveBytes * 8 / interval;

                            var srcLinks = _.filter(model.links, findSrcHostAndPort(deviceId, portNumber));
                            for (var j = 0; j < srcLinks.length; j++) {
                                srcLinks[j].srcTx = drTx;
                                srcLinks[j].srcRx = drRx;
                            }

                            var dstLinks = _.filter(model.links, findDstHostAndPort(deviceId, portNumber));
                            for (var i = 0; i < dstLinks.length; i++) {
                                dstLinks[i].dstTx = drTx;
                                dstLinks[i].dstRx = drRx;
                            }

                            drMax = Math.max(drRx, Math.max(drTx, drMax));
                        }
                    }
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
        if (data === null) {
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
        if (data === null) {
            console.error("processPorts called without data");
        } else {
            for (var deviceId in data) {
                if (data[deviceId]) {
                    var device = _.find(model.devices, findDevice(deviceId));
                    if (device) {
                        if (data[deviceId].port) {
                            var ports = mapper.ports.mapAll(data[deviceId].port, device);
                            device.updatePorts(ports);
                        }
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
        if (data === null) {
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
        if (data === null) {
            console.error("processHosts called without data");
        } else {
            var hostData = mapper.hosts.mapAll(data, model.devices);
            model.addDevices(hostData.hosts);
            model.addLinks(hostData.links);
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
            routing: "uds/routing/metrics/json",
            relaying: "uds/relaying/json",
            relayingUDP: "uds/relaying/udp/json",
            relayingTCP: "uds/relaying/tcp/json",
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

