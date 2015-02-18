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
    var _ = require("lodash"),
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
            ctrl.name = (configuration && configuration.controller && configuration.controller.name) || "UNK";
            ctrl.contact = (configuration && configuration.controller && configuration.controller.contact) || "UNK";
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
            var client = new nvm.Client(id, name || id, node && node.type, node && node.userName, url, node && node.location, node && node.purpose, node && node.color, d.lastSeen);
            client.internetAddresses = d.ipv4;
            return client;
        },
        mapAll: function(rawData, sw) {
            var lclClients = [];
            var lclLinks = [];

            if (rawData) {
                rawData.forEach(function (rawClient) {
                    var dst = _.find(sw, function (lclSwitch) {
                        if (rawClient && rawClient.attachmentPoint.length > 0) {
                            // port >= 0 to make sure switch control interface do not get displayed
                            return rawClient.attachmentPoint[0].switchDPID === lclSwitch.id && rawClient.attachmentPoint[0].port != -2;
                        }
                        return false;
                    });
                    if (dst) {
                        var client = clients.map(rawClient);
                        lclClients.push(client);
                        lclLinks.push(new nvm.Link(client, 0, dst, rawClient.attachmentPoint[0].port, "Ethernet"));
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
            var device = common.getDeviceEntry(obj.switchDPID);
            var node = device.node;
            var url = (node && node.url) || "";
            var name = common.getName(device);
            if (name) {
                url = url.replace(/#/g, name);
            } else {
                url = "";
            }
            var sw = new nvm.Switch(obj.switchDPID, name || obj.switchDPID,
                node && node.type,
                node && node.userName,
                url,
                node && node.location,
                node && node.purpose,
                node && node.color,
                obj.connectedSince,
                obj.inetAddress.split(":")[0].substr(1));

            return sw;
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
                        alreadyConnected[src][dst] = true;

                        res.push(link);
                    }
                });
            }

            return res;
        }
    };
    exports.links = links;

    var ports = {
        map: function(obj, existingPort) {
            var port = (existingPort !== undefined) ? existingPort : new nvm.Port(obj.portNumber);

            port.hardwareAddress = obj.hardwareAddress;
            port.name = obj.name;
            port.config = obj.config;
            port.state = obj.state;
            port.currentFeatures = obj.currentFeatures;
            port.advertisedFeatures = obj.advertisedFeatures;
            port.supportedFeatures = obj.supportedFeatures;
            port.peerFeatures = obj.peerFeatures;

            port.receivePackets = obj.receivePackets;
            port.transmitPackets = obj.transmitPackets;

            port.receiveBytes = obj.receiveBytes;
            port.transmitBytes = obj.transmitBytes;

            port.receiveDropped = obj.receiveDropped;
            port.transmitDropped = obj.transmitDropped;

            port.receiveErrors = obj.receiveErrors;
            port.transmitErrors = obj.transmitErrors;

            port.receiveFrameErrors = obj.receiveFrameErrors;
            port.receiveOverrunErrors = obj.receiveOverrunErrors;
            port.receiveCRCErrors = obj.receiveCRCErrors;

            port.collisions = obj.collisions;
            return port;
        },
        mapAll: function(obj, device) {
            var allPorts = {};
            for(var i = 0; i < obj.length; i++) {
                var p = obj[i];
                allPorts[p.portNumber] = ports.map(p, device.ports[p.portNumber]);
            }
            return allPorts;
        }
    };
    exports.ports = ports;

    // Mapping Flows
    var flows = {
        map: function(obj) {
            var flow = new nvm.Flow();

            flow.dl.src = "00:00:" + obj.match.eth_src;
            flow.dl.dst = "00:00:" + obj.match.eth_dst;
            flow.dl.type = parseInt(obj.match.eth_type);
            flow.dl.vlan = parseInt(obj.match.eth_vlan_vid, 10);
            // TODO: flow.dl.vlanPriority = parseInt(obj.match.dataLayerVirtualLanPriorityCodePoint, 10);

            flow.nw.src = obj.match.ipv4_src || obj.match.arp_spa;
            flow.nw.dst = obj.match.ipv4_dst || obj.match.arp_tpa;
            flow.nw.protocol = parseInt(obj.match.ip_proto || ((obj.match.arp_opcode) ? 1 : 0), 10);
            // TODO: flow.nw.typeOfService = parseInt(obj.match.networkTypeOfService, 10);

            flow.tp.src = parseInt(obj.match.tcp_src || obj.match.udp_src || 0, 10);
            flow.tp.dst = parseInt(obj.match.tcp_dst || obj.match.udp_src || 0, 10);

            flow.path.push(flow.dl.src);
            flow.path.push(flow.dl.dst);

            flow.id = crypt.flowId(flow);

            flow.actions = obj.actions;

            return flow;
        },
        mapAll: function(obj, devices) {
            var res = {};
            if (obj) {
                for (var deviceId in obj) {
                    var device = _.find(devices, function (lclDevice) { return lclDevice.id === deviceId; });

                    var flowList = obj[deviceId].flows;
                    if(flowList != null) {
                        for (var j = 0; j < flowList.length; j++) {
                            var flow = flows.map(flowList[j]);
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