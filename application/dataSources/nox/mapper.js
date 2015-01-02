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

(function() {
    "use strict";
    var _ = require("underscore"),
        common = require("../common"),
        config = require("../../config"),
        crypt = require("../../../public/shared/crypt"),
        network = require("../../../public/shared/network"),
        nvm = require("../../../public/shared/NVM");

    // Mapping Controller
    var controller = {
        map: function(obj) {
            var configuration = config.getConfiguration();

            var ctrl = new nvm.Controller(obj && obj.controllerType);
            ctrl.name = (configuration && configuration.controller && configuration.controller.name) || "unknown";
            ctrl.contact = (configuration && configuration.controller && configuration.controller.contact) || "unknown";
            ctrl.isStandalone = !(configuration && configuration.controller && !configuration.controller.isStandalone);
            ctrl.monitoredNetworks = [];

            if (obj) {
                obj.monitoredNetworks.forEach(function(nw) {
                    ctrl.monitoredNetworks.push(nw);
                });
            }

            return ctrl;
        }
    };
    exports.controller = controller;

    // Mapping Clients
    var clients = {
        map: function(d) {
            var device = common.getDeviceEntry(d.id);
            var node = device.node;
            var url = (node && node.url) || "";
            var name = common.getName(device);
            if (name) {
                url = url.replace(/#/g, name);
            } else {
                url = "";
            }

            return new nvm.Client(d.id, name || d.id, d.gw, d.ip, d.port, node && node.type, node && node.userName, url, node && node.location, node && node.purpose, node && node.color);
        },
        mapAll: function(rawData, sw) {
            var lclClients = [];
            var lclLinks = [];

            if (rawData) {
                rawData.forEach(function(rawClient) {
                    var client = clients.map(rawClient);
                    lclClients.push(client);
                    var dst = _.find(sw, function(lclSwitch) { return rawClient.gw === lclSwitch.id; });
                    if (dst) {
                        lclLinks.push(new nvm.Link(client, 0, dst, 0, "Ethernet"));
                    }
                });

            }

            return { clients: lclClients, links: lclLinks };
        }
    };
    exports.clients = clients;

    // Mapping Switches
    var switches = {
        map: function(obj) {
            var device = common.getDeviceEntry(obj);
            var node = device.node;
            var url = (node && node.url) || "";
            var name = common.getName(device);
            if (name) {
                url = url.replace(/#/g, name);
            } else {
                url = "";
            }
            return new nvm.Switch(obj, name || obj, node && node.type, node && node.userName, url, node && node.location, node && node.purpose, node && node.color);
        },
        mapAll: function(obj) {
            var res = [];

            if (obj) {
                obj.forEach(function(d) {
                    res.push(switches.map(d));
                });
            }

            return res;
        }
    };
    exports.switches = switches;

    // Mapping Links
    var links = {
        mapAll: function(obj, devices) {
            var res = [];
            var drMax = 0;

            var alreadyConnected = {};

            if (obj && Array.isArray(obj)) {
                obj.forEach(function(lnk) {
                    if (lnk.src > lnk.dst) {
                        return;
                    }

                    if (alreadyConnected[lnk.src] === undefined) {
                        alreadyConnected[lnk.src] = {};
                    }
                    if (alreadyConnected[lnk.dst] === undefined) {
                        alreadyConnected[lnk.dst] = {};
                    }
                    if (alreadyConnected[lnk.dst] && alreadyConnected[lnk.dst][lnk.src]) {
                        return;
                    }

                    var srcHost = _.find(devices, function(d) { return d.id === lnk.src; });
                    var dstHost = _.find(devices, function(d) { return d.id === lnk.dst; });

                    if (srcHost && dstHost) {
                        var link = new nvm.Link(srcHost, lnk.srcPort, dstHost, lnk.dstPort, "OpenFlow");
                        link.delay = parseFloat(lnk.delay);
                        link.plr = parseFloat(lnk.plr);
                        link.drTx = parseFloat(lnk.drTx);
                        link.drRx = parseFloat(lnk.drRx);

                        drMax = Math.max(drMax, Math.max(lnk.bw_tx, lnk.bw_rx));

                        alreadyConnected[lnk.src][lnk.dst] = true;

                        res.push(link);
                    }
                });
            }

            return { links: res, drMax: drMax };
        }
    };
    exports.links = links;


    // Mapping Flows
    var flows = {
        map: function(obj) {
            var flow = new nvm.Flow();

            flow.dl.src = network.num2mac(parseInt(obj.dlSrc, 10));
            flow.dl.dst = network.num2mac(parseInt(obj.dlDst, 10));
            flow.dl.type = parseInt(obj.dlType, 10);
            flow.dl.vlan = parseInt(obj.dlVlan, 10);
            flow.dl.vlanPriority = parseInt(obj.dlVlanPcp, 10);

            flow.nw.src = network.numberToIp(parseInt(obj.nwSrc, 10));
            flow.nw.dst = network.numberToIp(parseInt(obj.nwDst, 10));
            flow.nw.protocol = parseInt(obj.nwProt, 10);
            flow.nw.typeOfService = parseInt(obj.nwToS, 10);

            flow.tp.src = parseInt(obj.tpSrc, 10);
            flow.tp.dst = parseInt(obj.tpDst, 10);

            flow.path.push(flow.dl.src);
            flow.path.push(flow.dl.dst);

            flow.id = Math.abs(obj.id) || crypt.flowId(flow);

            return flow;
        },
        mapAll: function(obj, devices) {
            var res = {};
            if (obj.flows) {
                for (var flowId in obj.flows) {
                    var localFlow = flows.map(obj.flows[flowId]);
                    if (res[flowId] === undefined) {
                        res[flowId] = localFlow;
                    }
                }

                var registerFlow = function(deviceFlowId) {
                    var device = _.find(devices, function(lclDevice) { return lclDevice.id === deviceId; });
                    if (device) {
                        device.activeFlows.push(deviceFlowId);
                        res[deviceFlowId].path.push(device.id);
                    }
                };

                for (var deviceId in obj.flowsByDevice) {
                    obj.flowsByDevice[deviceId].forEach(registerFlow);
                }
            }

            var result = [];
            for (var i in res) {
                result.push(res[i]);
            }

            return result;
        }
    };
    exports.flows = flows;
})();