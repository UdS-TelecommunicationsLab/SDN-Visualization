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

(function (sdnViz) {
    "use strict";

    sdnViz.factory("topology", function (repository, packetLossRateFilter, delayFilter, deviceTypeIconFilter) {
        // Parameters
        var defaultParameters = {
            nodeSize: 10,
            animationDuration: 500,
            iconSize: 10,
            inactiveOpacity: 0.25
        };

        var colors = {flowLink: "#ffb800", openFlowLink: "#006fa2", cableLink: "#666", unknownLink: "#444"};

        // Helpers
        var boundingBox = function (actualValue, maxValue) {
            var minValue = defaultParameters.nodeSize + 2;
            if (_.isNaN(actualValue)) {
                return (maxValue - minValue) / 2;
            } else {
                return Math.min(maxValue - minValue, Math.max(actualValue, minValue));
            }
        };

        // Styles
        var defaultShapeStyle = function (collection) {
            collection
                .style({
                    "fill": function (d) {
                        return d.device.color;
                    },
                    "stroke": function (d) {
                        return d3.rgb(d.device.color).darker(1);
                    }
                });
            return collection;
        };

        var defaultDeviceActiveStyle = function (collection) {
            collection
                .style("opacity", function (d) {
                    return d.device.active ? 1.0 : defaultParameters.inactiveOpacity
                });
            return collection;
        };

        var defaultLinkActiveStyle = function (collection) {
            collection
                .style("opacity", function (d) {
                    return d.link.active ? 1.0 : defaultParameters.inactiveOpacity / 2
                });
            return collection;
        };

        var defaultLinkStyle = function (collection, linkStrengthMax) {
            collection
                .style({
                    "stroke": function (d) {
                        if (d.flowHighlight) return colors.flowLink;
                        else if (d.type == "OpenFlow") return colors.openFlowLink;
                        else if (d.type == "Ethernet") return colors.cableLink;
                        else return colors.unknownLink;
                    },
                    "stroke-width": function (d) {
                        return Math.min((d.dr / (2 * linkStrengthMax) * 7 + 3), 10) + "px";
                    }
                });
            return collection;
        };

        var defaultTextStyle = function (collection) {
            collection.text(function (d) {
                return deviceTypeIconFilter(d.device.deviceType);
            })
            return collection;
        }

        // Tooltips
        var createNodeTooltip = function (obj, tooltip) {
            var html = "<div><strong>" + ((obj.id !== obj.device.name) ? obj.device.name : "Unknown Device") + "</strong> ";
            if (obj.device.type == sdn.Client.type)
                html += "<span>(" + obj.device.interface.address + ")</span>";
            html += "<br /><code class='dp'>" + obj.id + "</code></div>";
            tooltip.html(html);
        };
        defaultParameters.nodeTooltip = createNodeTooltip;

        var createLinkTooltip = function (obj, tooltip) {
            var div = tooltip.append("div");
            div.append("strong").html("Link");
            div.append("br");
            var tab = div.append("table");
            if (obj.link) {
                if (obj.link.srcHost) {
                    var srcHost = tab.append("tr");
                    srcHost.append("th").html("Source:");
                    srcHost.append("td").html("<code>" + obj.link.srcHost.name + "</code> [" + obj.link.srcPort + "]");
                }
                if (obj.link.dstHost) {
                    var dstHost = tab.append("tr");
                    dstHost.append("th").html("Destination:");
                    dstHost.append("td").html("<code>" + obj.link.dstHost.name + "</code> [" + obj.link.dstPort + "]");
                }

                var plr = tab.append("tr");
                plr.append("th").html("Packet Loss:");
                plr.append("td").html(packetLossRateFilter(obj.link.plr));

                var delay = tab.append("tr");
                delay.append("th").html("Delay:");
                delay.append("td").html(delayFilter(obj.link.delay));

                var dr = tab.append("tr");
                dr.append("th").html("Data Rate (T/R):");
                dr.append("td").html(obj.link.drTx + " / " + obj.link.drRx + " kB/s");
            }
        };
        defaultParameters.linkTooltip = createLinkTooltip;

        // ChangeSet
        var calculateLinkChangeSet = function (change, linkCollection) {
            var linkChangeSet = {add: [], remove: [], changed: false, linkChanged: false};
            var localLinks = (change[objectDiff.token.value].links && change[objectDiff.token.value].links[objectDiff.token.value]) || [];
            for (var linkIndex in localLinks) {
                var linkChange = localLinks[linkIndex];
                if (linkChange[objectDiff.token.changed] !== objectDiff.token.equal) {
                    if (linkChange[objectDiff.token.changed] === objectDiff.token.added) {
                        linkChangeSet.changed = true;
                        var localLink = linkChange[objectDiff.token.value];
                        linkChangeSet.add.push({
                            id: localLink.id,
                            source: localLink.srcHost.id,
                            target: localLink.dstHost.id,
                            type: localLink.type,
                            link: localLink,
                            dr: (localLink.drTx + localLink.drRx)
                        });
                    } else if (linkChange[objectDiff.token.changed] === objectDiff.token.object) {
                        linkChangeSet.linkChanged = true;
                        var changedLink = _.find(linkCollection, function (lclL) {
                            return lclL.id == linkChange[objectDiff.token.value].id[objectDiff.token.value];
                        });
                        if (changedLink) {
                            repository.applyChanges(changedLink.link, linkChange);
                            changedLink.dr = (changedLink.link.drTx + changedLink.link.drRx);
                        }
                    } else if (linkChange[objectDiff.token.changed] === objectDiff.token.removed) {
                        linkChangeSet.changed = true;
                        var removeLink = _.find(linkCollection, function (localLink) {
                            return localLink.id == linkChange[objectDiff.token.value].id;
                        });
                        if (removeLink)
                            linkChangeSet.remove.push(removeLink);
                    }
                }
            }
            return linkChangeSet;
        };

        var calculateNodeChangeSet = function (change, nodeCollection) {
            var nodeChangeSet = {add: [], remove: [], changed: false, nodeChanged: false};
            var localDevices = (change[objectDiff.token.value].devices && change[objectDiff.token.value].devices[objectDiff.token.value]) || [];
            for (var deviceIndex in localDevices) {
                var nodeChange = localDevices[deviceIndex];
                if (nodeChange !== undefined && nodeChange[objectDiff.token.changed] !== objectDiff.token.equal) {
                    if (nodeChange[objectDiff.token.changed] === objectDiff.token.added) {
                        nodeChangeSet.changed = true;
                        nodeChangeSet.add.push({
                            id: nodeChange[objectDiff.token.value].id,
                            name: nodeChange[objectDiff.token.value].name,
                            device: nodeChange[objectDiff.token.value],
                            x: 0,
                            y: 0
                        });
                    } else if (nodeChange[objectDiff.token.changed] === objectDiff.token.object) {
                        nodeChangeSet.nodeChanged = true;
                        var changedNode = _.find(nodeCollection, function (lclN) {
                            return lclN.id == nodeChange[objectDiff.token.value].id[objectDiff.token.value];
                        });
                        if (changedNode) {
                            repository.applyChanges(changedNode.device, nodeChange);
                        }
                    } else if (nodeChange[objectDiff.token.changed] === objectDiff.token.removed) {
                        nodeChangeSet.changed = true;
                        var removeNode = _.find(nodeCollection, function (d) {
                            return d.id == nodeChange[objectDiff.token.value].id;
                        });
                        if (removeNode) {
                            nodeChangeSet.remove.push(removeNode);
                        }
                    }
                }
            }
            return nodeChangeSet;
        };

        return {
            boundingBox: boundingBox,
            calculateNodeChangeSet: calculateNodeChangeSet,
            calculateLinkChangeSet: calculateLinkChangeSet,
            colors: colors,
            createLinkTooltip: createLinkTooltip,
            createNodeTooltip: createNodeTooltip,
            defaultDeviceActiveStyle: defaultDeviceActiveStyle,
            defaultLinkStyle: defaultLinkStyle,
            defaultLinkActiveStyle: defaultLinkActiveStyle,
            defaultParameters: defaultParameters,
            defaultShapeStyle: defaultShapeStyle,
            defaultTextStyle: defaultTextStyle
        };
    });
})(window.sdnViz);