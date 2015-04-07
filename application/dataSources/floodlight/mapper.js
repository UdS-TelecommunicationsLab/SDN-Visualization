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

(function () {
    "use strict";
    var _ = require("lodash"),
        common = require("../common"),
        config = require("../../ui-config"),
        nvm = require("../../../public/shared/NVM");

    var mapEndpoints = function(flowId) {
        return function (d) {
            var fe = new nvm.FlowEntry();
            fe.id = flowId + "-" + d;
            fe.deviceId = d;
            fe.actions = {endpoint: true};
            return fe;
        };
    };

    var findSourceOrDestination = function (entry, port) {
        return function (d) {
            return (d.srcHost.id === entry.deviceId && d.srcPort === port) || (d.dstHost.id === entry.deviceId && d.dstPort === port);
        };
    };

    var findDestination = function (entry) {
        return function (d) {
            return (d.dstHost.id === entry.deviceId && d.dstPort === entry.inPort && d.srcHost.type === nvm.Host.type);
        };
    };

    var findSource = function (entry) {
        return function (d) {
            return (d.srcHost.id === entry.deviceId && d.srcPort === entry.inPort && d.dstHost.type === nvm.Host.type);
        };
    };

    // Mapping Controller
    var controller = {
        map: function () {
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

    var findDevice = function(deviceId) {
        return function (d) {
            return d.id === deviceId;
        };
    };

    // Mapping Hosts
    var hosts = {
        map: function (d) {
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
            var host = new nvm.Host(id, name || id, node && node.type, node && node.userName, url, node && node.location, node && node.purpose, node && node.color, d.lastSeen);
            host.internetAddresses = d.ipv4;
            return host;
        },
        mapAll: function (rawData, sw) {
            var lclHosts = [];
            var lclLinks = [];

            if (rawData) {
                rawData.forEach(function (rawHost) {
                    if(rawHost && rawHost.attachmentPoint.length > 0)
                    {
                        var dst = _.find(sw, function (lclSwitch) {
                            return rawHost.attachmentPoint[0].switchDPID === lclSwitch.id;
                        });
                        if (dst) {
                            var host = hosts.map(rawHost);
                            lclHosts.push(host);
                            var link = new nvm.Link(host, 1, dst, rawHost.attachmentPoint[0].port, "Ethernet");
                            link.active = dst.active || false;
                            lclLinks.push(link);
                        }
                    }
                });
            }
            return {hosts: lclHosts, links: lclLinks};
        }
    };
    exports.hosts = hosts;

    // Mapping Switches
    var switches = {
        map: function (obj) {
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
        mapAll: function (obj) {
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
        mapAll: function (rawData, devices) {
            var res = [];

            var alreadyConnected = {};

            if (rawData && _.isArray(rawData)) {
                for(var i = 0; i < rawData.length; i++) {
                    var lnk = rawData[i];
                    var src = lnk["src-switch"];
                    var dst = lnk["dst-switch"];
                    var srcPort = parseInt(lnk["src-port"], 10);
                    var dstPort = parseInt(lnk["dst-port"], 10);

                    if (src > dst) {
                        continue;
                    }

                    if (alreadyConnected[src] === undefined) {
                        alreadyConnected[src] = {};
                    }
                    if (alreadyConnected[dst] === undefined) {
                        alreadyConnected[dst] = {};
                    }
                    if (alreadyConnected[dst] && alreadyConnected[dst][src]) {
                        continue;
                    }

                    var srcHost = _.find(devices, findDevice(src));
                    var dstHost = _.find(devices, findDevice(dst));

                    if (srcHost && dstHost) {
                        var link = new nvm.Link(srcHost, srcPort, dstHost, dstPort, "OpenFlow");
                        alreadyConnected[src][dst] = true;
                        res.push(link);
                    }
                }
            }
            return res;
        }
    };
    exports.links = links;

    var ports = {
        map: function (obj, existingPort, deviceId) {
            var port = (existingPort !== undefined) ? existingPort : new nvm.Port(parseInt(obj.portNumber, 10), deviceId);

            if(obj.hardwareAddress !== undefined) {
                port.hardwareAddress = obj.hardwareAddress;
                port.name = obj.name;
                port.config = parseInt(obj.config, 10);
                port.state = parseInt(obj.state, 10);
                port.currentFeatures = parseInt(obj.currentFeatures, 10);
                port.advertisedFeatures = parseInt(obj.advertisedFeatures, 10);
                port.supportedFeatures = parseInt(obj.supportedFeatures, 10);
                port.peerFeatures = parseInt(obj.peerFeatures, 10);
            } else {
                port.receivePackets = parseInt(obj.receivePackets, 10);
                port.transmitPackets = parseInt(obj.transmitPackets, 10);

                port.receiveBytes = parseInt(obj.receiveBytes, 10);
                port.transmitBytes = parseInt(obj.transmitBytes, 10);

                port.receiveDropped = parseInt(obj.receiveDropped, 10);
                port.transmitDropped = parseInt(obj.transmitDropped, 10);

                port.receiveErrors = parseInt(obj.receiveErrors, 10);
                port.transmitErrors = parseInt(obj.transmitErrors, 10);

                port.receiveFrameErrors = parseInt(obj.receiveFrameErrors, 10);
                port.receiveOverrunErrors = parseInt(obj.receiveOverrunErrors, 10);
                port.receiveCRCErrors = parseInt(obj.receiveCRCErrors, 10);

                port.collisions = parseInt(obj.collisions, 10);
            }
            return port;
        },
        mapAll: function (obj, device) {
            var allPorts = {};
            for (var i = 0; i < obj.length; i++) {
                var p = obj[i];
                if (p.portNumber === "local") {
                    continue;
                }
                var portNumber = parseInt(p.portNumber, 10);
                allPorts[portNumber] = ports.map(p, device.ports[portNumber], device.id);
            }
            return allPorts;
        }
    };
    exports.ports = ports;

    // Mapping Flows
    var flows = {
        map: function (obj, deviceId, flowId) {
            var flowEntry = new nvm.FlowEntry();
            flowEntry.id = flowId + "-" + deviceId;
            flowEntry.deviceId = deviceId;
            flowEntry.inPort = parseInt(obj.match.in_port || 0, 10);

            flowEntry.packetCount = parseInt(obj.packetCount || 0, 10);
            flowEntry.byteCount = parseInt(obj.byteCount || 0, 10);
            flowEntry.durationSeconds = parseInt(obj.durationSeconds || 0, 10);
            flowEntry.priority = parseInt(obj.priority || 0, 10);
            flowEntry.idleTimeoutSeconds = parseInt(obj.idleTimeoutSec || 0, 10);
            flowEntry.hardTimeoutSeconds = parseInt(obj.hardTimeoutSec || 0, 10);

            flowEntry.dl.src = "00:00:" + obj.match.eth_src;
            flowEntry.dl.dst = "00:00:" + obj.match.eth_dst;
            flowEntry.dl.type = parseInt(obj.match.eth_type || 0, 10);
            flowEntry.dl.vlan = parseInt(obj.match.eth_vlan_vid || 0, 10) || 0;
            // TODO: flow.dl.vlanPriority = parseInt(obj.match.dataLayerVirtualLanPriorityCodePoint, 10);

            if (obj.match.arp_opcode) {
                flowEntry.nw.src = obj.match.arp_spa || "";
                flowEntry.nw.dst = obj.match.arp_tpa || "";
                flowEntry.nw.protocol = -1;
            } else {
                flowEntry.nw.src = obj.match.ipv4_src || "";
                flowEntry.nw.dst = obj.match.ipv4_dst || "";
                flowEntry.nw.protocol = parseInt(obj.match.ip_proto || 0, 10);
            }
            flowEntry.nw.typeOfService = parseInt(obj.match.ip_dscp || 0, 10);

            flowEntry.tp.src = parseInt(obj.match.tcp_src || obj.match.udp_src || 0, 10);
            flowEntry.tp.dst = parseInt(obj.match.tcp_dst || obj.match.udp_src || 0, 10);

            flowEntry.actions = _.clone(obj.actions);

            return flowEntry;
        },
        mapAll: function (rawObject, devices, links) {
            var flowByCookie = {};
            if (rawObject) {
                for (var deviceId in rawObject) {
                    if(rawObject[deviceId] && rawObject[deviceId].ERROR) {
                        continue;
                    }

                    var switchFlows = rawObject[deviceId].flows;
                    if (switchFlows !== null) {
                        for (var j = 0; j < switchFlows.length; j++) {
                            var flowObj = switchFlows[j];
                            var flowId = flowObj.cookie;
                            if (flowByCookie[flowId] === undefined) {
                                flowByCookie[flowId] = new nvm.Flow(flowId);
                            }
                            flowByCookie[flowId].entries.push(flows.map(flowObj, deviceId, flowId));

                            var device = _.find(devices, findDevice(deviceId));
                            if (device) {
                                device.activeFlows.push(flowId);
                            }
                        }
                    }
                }
            }

            var result = [];

            for (var m in flowByCookie) {
                var flow = flowByCookie[m];

                var sources = [];
                var destinations = [];
                var protocols = [];
                var services = [];

                var endpoints = [];
                for (var k = 0; k < flow.entries.length; k++) {
                    var entry = flow.entries[k];

                    sources.push(entry.nw.src);
                    destinations.push(entry.nw.dst);
                    protocols.push(entry.nw.protocol);
                    services.push(entry.tp.src);
                    services.push(entry.tp.dst);

                    for (var action in entry.actions) {
                        var port = parseInt(entry.actions[action], 10);
                        if (action === "output") {
                            var link = _.find(links, findSourceOrDestination(entry, port));
                            if (link) {
                                flow.links.push({
                                    linkId: link.id,
                                    direction: "forward"
                                });
                                if (link.srcHost.type === nvm.Host.type) {
                                    endpoints.push(link.srcHost.id);
                                    link.srcHost.activeFlows.push(flow.id);
                                }
                                if (link.dstHost.type === nvm.Host.type) {
                                    endpoints.push(link.dstHost.id);
                                    link.dstHost.activeFlows.push(flow.id);
                                }
                            }
                        } else if(action === "none") {
                            entry.actions["drop"] = true;
                        } else {
                            // TODO: handle other actions
                            console.log(action);
                        }
                    }

                    if (entry.actions.length === 0) {
                        entry.actions["drop"] = true;
                    } else {
                        var sourceLinks = _.filter(links, findSource(entry));
                        for (var i = 0; i < sourceLinks.length; i++) {
                            flow.links.push({
                                linkId: sourceLinks[i].id,
                                direction: "forward" // TODO: properly set direction
                            });
                            endpoints.push(sourceLinks[i].dstHost.id);
                            sourceLinks[i].dstHost.activeFlows.push(flow.id);
                        }
                        var destinationLinks = _.filter(links, findDestination(entry));

                        for (var n = 0; n < destinationLinks.length; n++) {
                            flow.links.push({
                                linkId: destinationLinks[i].id,
                                direction: "forward" // TODO: properly set direction
                            });
                            endpoints.push(destinationLinks[n].srcHost.id);
                            destinationLinks[n].srcHost.activeFlows.push(flow.id);
                        }
                    }
                    flow.endpoints = _.unique(endpoints).map(mapEndpoints(flow.id));
                }

                var src = _.unique(sources);
                var dst = _.unique(destinations);
                if (src.length === 1 && dst.length === 1 || (src.length === 2 && dst.length === 2 && _.difference(src, dst).length === 0)) {
                    flow.source = src[0];
                    flow.destination = dst[0];
                }

                var protocol = _.unique(protocols);
                if (protocol.length === 1) {
                    flow.protocol = protocol[0];

                    if (flow.protocol === 6 || flow.protocol === 17) {
                        var service = _.unique(services);
                        if (service.length === 1) {
                            flow.service = service[0];
                        } else if (service.length === 2) {
                            flow.service = Math.min(service[0], service[1]);
                        }
                    }
                }

                flow.entries = _.sortBy(_.union(flow.entries, flow.endpoints), function (d) {
                    return d.deviceId;
                });
                delete flow.endpoints;

                result.push(flow);
            }

            return result;
        }
    };
    exports.flows = flows;
})();