/*
 * Copyright (c) 2013 - 2014 Saarland University
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

            var ctrl = new nvm.Controller("Floodlight");
            ctrl.name = (configuration && configuration.controller && configuration.controller.name) || "unknown";
            ctrl.contact = (configuration && configuration.controller && configuration.controller.contact) || "unknown";
            ctrl.isStandalone = !(configuration && configuration.controller && !configuration.controller.isStandalone);
            ctrl.monitoredNetworks = [];

            // TODO: add monitoredNetworks

            return ctrl;
        }
    };
    exports.controller = controller;

    // Mapping Clients
    var clients = {
        map: function(d) {
            var id = "00:00:" + d.mac[0];
            var device = common.getDeviceEntry(id);
            var node = device.node;
            var url = (node && node.url) || "";
            var name = common.getName(device);
            if (name) {
                url = url.replace(/#/g, name);
            } else {
                url = "";
            }
            var gateway = undefined;

            var attachmentPoints = d.attachmentPoint;
            if (attachmentPoints.length > 0) {
                gateway = attachmentPoints[0].switchDPID;
            }
            var ip = undefined;
            if (d.ipv4 && d.ipv4.length > 0) {
                ip = d.ipv4[0];
            }
            return new nvm.Client(id, name || id, gateway, ip, d.port, node && node.type, node && node.userName, url, node && node.location, node && node.purpose, node && node.color);
        },
        mapAll: function(rawData, sw) {
            var lclClients = [];
            var lclLinks = [];

            if (rawData) {
                rawData.forEach(function (rawClient) {
                    var dst = _.find(sw, function (lclSwitch) {
                        if (rawClient && rawClient.attachmentPoint.length > 0) {
                            return rawClient.attachmentPoint[0].switchDPID === lclSwitch.id;
                        }
                        return false;
                    });
                    if (dst) {
                        var client = clients.map(rawClient);
                        lclClients.push(client);
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
            var device = common.getDeviceEntry(obj.dpid);
            var node = device.node;
            var url = (node && node.url) || "";
            var name = common.getName(device);
            if (name) {
                url = url.replace(/#/g, name);
            } else {
                url = "";
            }
            return new nvm.Switch(obj.dpid, name || obj.dpid, node && node.type, node && node.userName, url, node && node.location, node && node.purpose, node && node.color, obj.connectedSince);
        },
        mapAll: function(obj) {
            var res = [];

            if (obj) {
                obj.forEach(function (d) {
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
                    var src = lnk["src-switch"];
                    var dst = lnk["dst-switch"];

                    if (src > dst) {
                        return;
                    }

                    if (alreadyConnected[src] === undefined) {
                        alreadyConnected[src] = {};
                    }
                    if (alreadyConnected[dst] === undefined) {
                        alreadyConnected[dst] = {};
                    }
                    if (alreadyConnected[dst] && alreadyConnected[dst][src]) {
                        return;
                    }

                    var srcHost = _.find(devices, function(d) { return d.id === src; });
                    var dstHost = _.find(devices, function(d) { return d.id === dst; });

                    if (srcHost && dstHost) {
                        var link = new nvm.Link(srcHost, lnk["src-port"], dstHost, lnk["dst-port"], "OpenFlow");
                        //link.delay = parseFloat(lnk.delay);
                        //link.plr = parseFloat(lnk.plr);
                        //link.drTx = parseFloat(lnk.drTx);
                        //link.drRx = parseFloat(lnk.drRx);

                        //drMax = Math.max(drMax, Math.max(lnk.bw_tx, lnk.bw_rx));

                        alreadyConnected[src][dst] = true;

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

            flow.dl.src = "00:00:" + obj.match.dataLayerSource;
            flow.dl.dst = "00:00:" + obj.match.dataLayerDestination;
            flow.dl.type = parseInt(obj.match.dataLayerType.replace(/0x/g, ""), 16);
            flow.dl.vlan = parseInt(obj.match.dataLayerVirtualLan, 10);
            flow.dl.vlanPriority = parseInt(obj.dldataLayerVirtualLanPriorityCodePoint, 10);

            flow.nw.src = obj.match.networkSource;
            flow.nw.dst = obj.match.networkDestination;
            flow.nw.protocol = parseInt(obj.match.networkProtocol, 10);
            flow.nw.typeOfService = parseInt(obj.match.networkTypeOfService, 10);

            flow.tp.src = parseInt(obj.match.transportSource, 10);
            flow.tp.dst = parseInt(obj.match.transportDestination, 10);

            flow.path.push(flow.dl.src);
            flow.path.push(flow.dl.dst);

            flow.id = crypt.flowId(flow);

            return flow;
        },
        mapAll: function(obj, devices) {
            var res = {};
            if (obj) {
                for (var deviceId in obj) {
                    var device = _.find(devices, function (lclDevice) { return lclDevice.id === deviceId; });

                    var sw = obj[deviceId];

                    for (var j = 0; j < sw.length; j++) {
                        var flow = flows.map(sw[j]);
                        var flowId = flow.id;
                        if (res[flowId] === undefined) {
                            res[flowId] = flow;
                        }

                        if (device) {
                            device.activeFlows.push(flowId);
                            res[flowId].path.push(device.id);
                        }
                    }
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