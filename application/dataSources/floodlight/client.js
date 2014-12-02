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

(function (client) {
    "use strict";
    var mapper = require("./mapper"),
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

    var processInfos = function (data) {
        if (data === null || data == undefined || data === {}) {
            console.error("processInfos called without data");
        } else {
            model.controller = mapper.controller.map(data);
            model.controller.started = started;

            getResource(client.commands.get.links, processLinks);
        }

        callback();
    };

    var processSwitches = function (data) {
        if (data === null || data == undefined || data === {}) {
            console.error("processSwitches called without data");
        } else {
            model.devices = model.devices.concat(mapper.switches.mapAll(data));
        }

        getResource(client.commands.get.devices, processDevices);
        getResource(client.commands.get.flows, processFlows);

        callback();
    };

    var processLinks = function (data) {
        if (data == null) {
            console.error("processLinks called without data");
        } else {
            var linkData = mapper.links.mapAll(data, model.devices);
            model.links = model.links.concat(linkData.links);
            model._internals.drMax = linkData.drMax;
        }

        callback();
    };

    var processFlows = function (data) {
        if (data == null) {
            console.error("processFlows called without data");
        } else {
            model.flows = mapper.flows.mapAll(data, model.devices);
        }

        callback();
    };

    var processDevices = function (data) {
        if (data == null) {
            console.error("processDevices called without data");
        } else {
            var clientData = mapper.clients.mapAll(data, model.devices);
            model.devices = model.devices.concat(clientData.clients);
            model.links = model.links.concat(clientData.links);
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
            flows: "core/switch/all/flow/json"
        }
    };
})(exports);

