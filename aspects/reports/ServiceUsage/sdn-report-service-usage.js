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

(function(sdnViz){
    "use strict";
    sdnViz.directive("sdnReportServiceUsage", function() {
        return {
            replace: true,
            restrict: "E",
            templateUrl: "/templates/reports/ServiceUsage/sdn-report-service-usage",
            compile: function() {
                return function(scope, element) {
                    scope.element = element[0];
                };
            },
            controller: function($scope, repository, deviceTypeIconFilter) {
                var processProtocol = function(report, protocolKey) {
                    var protocol = {
                        "protocol": protocolKey,
                        "ports": report[protocolKey]
                    };

                    var devices = {};

                    var colors = ["#a6cee3","#1f78b4","#b2df8a","#33a02c", "#fb9a99","#e31a1c","#fdbf6f","#ff7f00","#cab2d6","#6a3d9a","#009999","#b15928"];
                    var i = 0;
                    for (var service in report[protocolKey]) {
                        report[protocolKey][service] = {
                            "name": report[protocolKey][service],
                            "color": colors[i % colors.length]
                        };
                        i++;
                    }

                    for(var dpid in report.devices) {
                        var completeDevice = report.devices[dpid];
                        var device = { "consumes": {}, "provides": {}, "device": completeDevice.device };

                        if(completeDevice.consumes !== undefined)
                        {
                            for(var c in completeDevice.consumes[protocolKey]) {
                                device.consumes[c] = {
                                    weight: completeDevice.consumes[protocolKey][c],
                                    name: report[protocolKey][c].name,
                                    color: report[protocolKey][c].color
                                }
                            }
                        }

                        if(completeDevice.provides !== undefined) {
                            for(var p in completeDevice.provides[protocolKey]) {
                                device.provides[p] = {
                                    weight: completeDevice.provides[protocolKey][p],
                                    name: report[protocolKey][p].name,
                                    color: report[protocolKey][p].color
                                }
                            }
                        }

                        devices[dpid] = device;
                    }

                    protocol.devices = devices;
                    return protocol;
                };

                var buildLegend = function(region) {
                    var section = region.append("div").classed("panel-body", true);
                    section.append("span").text("Services: ");
                    section.selectAll("span.protocol").data(function (protocol) {
                        return _.map(_.keys(protocol.ports), function(port) {
                            return {"port": port, "color": protocol.ports[port].color, "name": protocol.ports[port].name};
                        });
                    }).enter().append("span").classed("label label-default protocol", true)
                        .style("background-color", function (protocol) { return protocol.color; })
                        .text(function (protocol) { return protocol.name + " [" + protocol.port + "]"; });
                };

                var buildDeviceBox = function(device) {
                    return "<span class='device " + device.type + "' style='background-color: " + device.color + "'>" +
                        "<i class='fa fa-fw'>" + deviceTypeIconFilter(device.deviceType) + "</i></span>";
                };

                var selectColumn = function(key) {
                    return function (entry) {
                        return _.map(_.keys(entry[key]), function (q) {
                            return _.extend(_.pick(entry[key][q], ["weight", "color", "name"]), {port: q});
                        });
                    };
                };

                var buildColumn = function (rows, data) {
                    var protocols = rows.append("td").attr("width", "45%").selectAll("span").data(data).enter().append("span").classed("protocol", true);
                    protocols.classed("label", true)
                        .style("background-color", function(protocol) { return protocol.color; })
                        .text(function(protocol) { return protocol.name + " [" + protocol.port + "]"+ " (" + protocol.weight + ")";})
                };

                var buildVisualization = function(protocols) {
                    var element = d3.select($scope.element).select(".protocols");
                    element.selectAll("table").remove();

                    var tables = element.selectAll("table").data(protocols).enter();
                    var region = tables.append("div").classed("table-responsive panel panel-default", true);
                    region.append("div").classed("panel-heading", true).text(function(d) { return d.protocol.toUpperCase();});
                    var table = region.append("table").classed("table table-bordered table-striped table-condensed", true);
                    var thead = table.append("thead").append("tr");
                    thead.append("th").text("Device");
                    thead.append("th").text("Consuming");
                    thead.append("th").text("Providing");

                    var rows = table.append("tbody").selectAll("tr").data(function(d) {
                        return _.map(_.keys(d.devices), function(q) { return _.extend(_.pick(d.devices[q], ["device", "consumes", "provides"]), {dpid: q}); });
                    }).enter().append("tr");

                    rows.append("td").attr("width", "180px").html(function(d) {
                        if(d.device) {
                            return buildDeviceBox(d.device) + "<a href='/detail/device/" +
                                d.dpid + "'><code class='dp'>" + d.device.name + "</code></a>";
                        } else {
                            return "<a href='/detail/device/" + d.dpid + "'><code class='dp'>" + d.dpid + "</code></a>";
                        }
                    });
                    buildColumn(rows, selectColumn("consumes"));
                    buildColumn(rows, selectColumn("provides"));
                    buildLegend(region);
                };

                var augmentDevices = function (report) {
                    for (var dpid in report.devices) {
                        var device = repository.getDeviceById(dpid);
                        if (device && device.item)
                            report.devices[dpid]["device"] = device.item;
                    }
                };

                var augmentReport = function () {
                    var report = _.cloneDeep($scope.content);
                    augmentDevices(report);

                    var availableProtocols = ["tcp", "udp"];
                    var protocols = [];
                    for (var i = 0; i < availableProtocols.length; i++) {
                        protocols.push(processProtocol(report, availableProtocols[i]));
                    }

                    buildVisualization(protocols);
                };

                $scope.$watch("content", augmentReport, true);
            },
            scope: {
                content: "="
            }
        };
    });
})(window.sdnViz);