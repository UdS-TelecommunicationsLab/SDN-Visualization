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

var __extends = this.__extends || function(d, b) {
    for (var p in b) {
        if (b.hasOwnProperty(p)) {
            d[p] = b[p];
        }
    }

    function Ctor() { this.constructor = d; }

    Ctor.prototype = b.prototype;
    d.prototype = new Ctor();
};

(function(exports) {
    "use strict";
    /**
     * The NVM type assembles all the other entites together in one extensive model.
     */
    exports.NVM = function(startDate) {
        this.started = startDate || (new Date());
        this.latestInteraction = new Date();
        this.latestUpdate = new Date();

        this.controller = new exports.Controller(new Date());

        this.devices = [];
        this.links = [];
        this.flows = [];

        // used for storing temporary data
        this._internals = {
            drMax: 0
        };
    };


    /**
     * The Controller type that stores general information like name, type and the monitored networks.
     */
    exports.Controller = function(type) {
        this.name = "unknown";
        this.type = type || "unknown";
        this.monitoredNetworks = [];
        this.isReachable = false;
        this.isStandalone = true;
    };


    /**
     * The Link contains two connected hosts and some statistics about the connection in between.
     */
    exports.Link = function(srcHost, srcPort, dstHost, dstPort, type) {
        this.id = srcHost.id + '.' + dstHost.id;
        this.srcHost = srcHost;
        this.srcPort = srcPort;
        this.dstHost = dstHost;
        this.dstPort = dstPort;
        this.type = type;
        this.drTx = null;
        this.drRx = null;
        this.plr = null;
        this.delay = null;
    };


    /**
     * The Interface encapsulates information on the connected switch, port and the configured IP address.
     */
    exports.Interface = function(gw, address, port) {
        this.gw = gw;
        this.address = address;
        this.port = port;
    };


    /**
     * The Device represents a common base class for Clients and Switches.
     */
    exports.Device = function(id, name, userName, url, location, purpose, color) {
        this.id = id;
        this.name = name || id;
        this.type = exports.Device.type;
        this.deviceType = "";
        this.location = location || "-";
        this.purpose = purpose || "-";
        this.userName = userName || "";
        this.url = url || "";
        this.color = color || "#444444";
        this.activeFlows = [];
    };
    exports.Device.type = "Unknown";


    /**
     * The Client contains a connected interface as well as general information of devices.
     */
    exports.Client = (function(base) {
        var client = function(id, name, gw, ip, port, deviceType, userName, url, location, purpose, color) {
            base.call(this, id, name, userName, url, location, purpose, color);
            this.type = exports.Client.type;
            this.deviceType = deviceType;
            this.interface = new exports.Interface(gw, ip, port);
        };
        __extends(client, base);
        return client;
    })(exports.Device);
    exports.Client.type = "Client";

    /**
     * The Switch primarily extends Device. It does not contain specific fields.
     */
    exports.Switch = (function(base) {
        var lclSwitch = function (id, name, deviceType, userName, url, location, purpose, color, connectedSince) {
            base.call(this, id, name, userName, url, location, purpose, color);
            this.type = exports.Switch.type;
            this.deviceType = deviceType || "Node";
            this.connectedSince = new Date(connectedSince);
        };
        __extends(lclSwitch, base);
        return lclSwitch;
    })(exports.Device);
    exports.Switch.type = "Switch";


    /**
     * The Flow contains information on all layers from data link over network to transport layer.
     */
    exports.Flow = function() {
        this.id = "";

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
            dst: 0, // Port
        };

        this.path = []; // list of NodeIDs from src to dst
    };


})((typeof process === 'undefined' || !process.versions) ? window.ofviz = window.ofviz || {} : exports);