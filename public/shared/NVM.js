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

var __extends = this.__extends || function (d, b) {
        for (var p in b) {
            if (b.hasOwnProperty(p)) {
                d[p] = b[p];
            }
        }

        function Ctor() {
            this.constructor = d;
        }

        Ctor.prototype = b.prototype;
        d.prototype = new Ctor();
    };

(function (exports, _) {
    "use strict";

    /**
     * The NVM type assembles all the other entites together in one extensive model.
     */
    exports.NVM = function (startDate, oldModel) {
        var self = this;
        self.started = startDate || (new Date());
        self.latestUpdate = new Date();

        self.controller = new exports.Controller(new Date());

        self.devices = [];
        self.links = [];
        self.flows = [];

        if (oldModel) {
        var setInactive = function (d) {
            return _.extend(d, {active: false});
        };
            self.devices = _.cloneDeep(oldModel.devices).map(setInactive);
            self.links = _.cloneDeep(oldModel.links).map(setInactive);
        }

        // used for storing temporary data
        self._internals = {
            drMax: 0
        };

        var mergeEntitiesWithExisting = function (targetCollection) {
            return function (newItems) {
                newItems.forEach(function (newItem) {
                    var existingItem = _.find(targetCollection, function (d) {
                        return d.id === newItem.id;
                    });
                    if (existingItem !== undefined) {
                        _.extend(existingItem, newItem);
                    } else {
                        targetCollection.push(newItem);
                    }
                });
            };
        };

        self.addDevices = mergeEntitiesWithExisting(self.devices);
        self.addLinks = mergeEntitiesWithExisting(self.links);
    };


    /**
     * The Controller type that stores general information like name, type and the monitored networks.
     */
    exports.Controller = function (type) {
        this.name = "UNK";
        this.type = type || "UNK";
        this.monitoredNetworks = [];
        this.isReachable = false;
        this.isStandalone = true;
    };

    /**
     * The Link contains two connected hosts and some statistics about the connection in between.
     */
    exports.Link = function (srcHost, srcPort, dstHost, dstPort, type) {
        if(srcHost.id > dstHost.id) {
            var tmpHost = srcHost;
            srcHost = dstHost;
            dstHost = tmpHost;

            var tmpPort = srcPort;
            srcPort = dstPort;
            dstPort = tmpPort;
        }

        this.id = srcHost.id + '-' + srcPort + '.' + dstHost.id + "-" + dstPort;
        this.active = true;
        this.srcHost = srcHost;
        this.srcPort = srcPort;
        this.dstHost = dstHost;
        this.dstPort = dstPort;
        this.type = type;
        this.srcTx = null;
        this.srcRx = null;
        this.dstTx = null;
        this.dstRx = null;
        this.srcPlr = null;
        this.dstPlr = null;
        this.srcDelay = null;
        this.dstDelay = null;
    };


    /**
     * The Port represents a physical port on a switch, which has some associated statistics.
     */
    exports.Port = function (portNumber, deviceId) {
        this.id = deviceId + "- + portNumber";
        this.number = portNumber;

        this.hardwareAddress = "";
        this.name = "";

        this.config = null;
        this.state = null;
        this.currentFeatures = null;
        this.advertisedFeatures = null;
        this.supportedFeatures = null;
        this.peerFeatures = null;

        this.receivePackets = null;        // number
        this.transmitPackets = null;       // number

        this.receiveBytes = null;          // number
        this.transmitBytes = null;         // number

        this.receiveDropped = null;        // number
        this.transmitDropped = null;       // number

        this.receiveErrors = null;         // number
        this.transmitErrors = null;        // number

        this.receiveFrameErrors = null;    // number
        this.receiveOverrunErrors = null;  // number
        this.receiveCRCErrors = null;      // number

        this.collisions = null;            // number
    };


    /**
     * The Device represents a common base class for Clients and Switches.
     */
    exports.Device = function (id, name, userName, url, location, purpose, color) {
        var self = this;

        self.id = id;
        self.active = true;
        self.name = name || id;
        self.type = exports.Device.type;
        self.deviceType = "";
        self.location = location || "-";
        self.purpose = purpose || "-";
        self.userName = userName || "";
        self.url = url || "";
        self.color = color || "#444444";
        self.activeFlows = [];
        self.internetAddresses = [];
        self.ports = {};

        self.updatePorts = function(ports) {
            for(var portNumber in ports) {
                if (self.ports[portNumber] !== undefined) {
                    self.ports[portNumber] = _.assign(self.ports[portNumber], ports[portNumber], function(value, other) {
                        return (_.isNull(other)) ? value : other;
                    });
                } else {
                    self.ports[portNumber] = ports[portNumber];
                }
            }
        };
    };
    exports.Device.type = "Unknown";


    /**
     * The Client contains a connected interface as well as general information of devices.
     */
    exports.Client = (function (base) {
        var client = function (id, name, deviceType, userName, url, location, purpose, color, lastSeen) {
            base.call(this, id, name, userName, url, location, purpose, color);
            this.type = exports.Client.type;
            this.deviceType = deviceType;
            this.lastSeen = lastSeen || new Date(0);
        };
        __extends(client, base);
        return client;
    })(exports.Device);
    exports.Client.type = "Client";


    /**
     * The Switch primarily extends Device. It does not contain specific fields.
     */
    exports.Switch = (function (base) {
        var lclSwitch = function (id, name, deviceType, userName, url, location, purpose, color, connectedSince, inetAddress) {
            base.call(this, id, name, userName, url, location, purpose, color);
            this.type = exports.Switch.type;
            this.deviceType = deviceType || "Node";
            this.connectedSince = new Date(connectedSince);
            this.description = {};
            this.capabilities = "";
            this.actions = "";
            this.attributes = [];
            this.controllerAddress = inetAddress || "UNK";
        };
        __extends(lclSwitch, base);
        return lclSwitch;
    })(exports.Device);
    exports.Switch.type = "Switch";


    /**
     * The Flow contains information on all layers from data link over network to transport layer.
     */
    exports.Flow = function (id) {
        this.id = id || "0";
        this.entries = [];
        this.source = "UNK";
        this.destination = "UNK";
        this.service = 0;
        this.protocol = "UNK";
        this.label = "UNK";
        this.links = [];
    };

    /**
     * The FlowEntry contains information on the match and the associated actions.
     */
    exports.FlowEntry = function() {
        this.id = "";
        this.inPort = 0;

        // Data Link Layer
        this.dl = {
            src: "00:00:00:00:00:00", // MAC address
            dst: "00:00:00:00:00:00", // MAC address
            type: 0, // Protocol type
            vlan: 0, // Vlan Tag
            vlanPriority: 0 // Vlan Priority
        };

        // Network Layer
        this.nw = {
            src: "0.0.0.0", // IP address
            dst: "0.0.0.0", // IP address
            typeOfService: 0,
            protocol: 0
        };

        // Transport Layer
        this.tp = {
            src: 0, // Port
            dst: 0 // Port
        };

        this.packetCount = 0;
        this.byteCount = 0;
        this.durationSeconds = 0;
        this.priority = 0;
        this.idleTimeoutSeconds = 0;
        this.hardTimeoutSeconds = 0;

        this.actions = [];
    };

})((typeof process === 'undefined' || !process.versions) ? window.sdn = window.sdn || {} : exports,
    (typeof process === 'undefined' || !process.versions) ? window._ : require("lodash"));