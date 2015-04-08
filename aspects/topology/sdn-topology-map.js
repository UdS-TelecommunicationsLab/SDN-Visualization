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

(function (sdnViz) {
    "use strict";

    sdnViz.directive("sdnTopologyMap", function () {
        return {
            restrict: "E",
            replace: true,
            templateUrl: "/templates/topology/sdn-topology-map",
            compile: function () {
                return function (scope, element) {
                    scope.element = element;
                };
            },
            scope: {
                "height": "@",
                "styles": "=",
                "visibilityButton": "@",
                "showInactive": "@",
                "identifier": "@"
            },
            controller: function ($rootScope, $scope, $modal, router, repository, messenger, topology, websockets, locker, hasIdOrNameFilter) {
                $scope.showInactive = false;

                var isMapCreated = false;
                var isDataInitialized = false;

                var defaults = _.cloneDeep(topology.defaultParameters);

                locker.bind($scope, "zoomFactor", 1.0);

                $scope.$watch("zoomFactor", function () {
                    $scope.currentSize = defaults.nodeSize * $scope.zoomFactor;
                });

                $scope.$watch("showInactive", function () {
                    $scope.showInactive = !($scope.showInactive != true && $scope.showInactive != "true");
                    restart();
                });

                $scope.$watch("visibilityButton", function () {
                    $scope.visibilityButton = !($scope.visibilityButton != true && $scope.visibilityButton != "true");
                });

                $rootScope.$watch("deviceFilter", function () {
                    resetAll();
                    if ($scope.data && $scope.data.nvm) {
                        var devices = _.map(hasIdOrNameFilter($scope.data.nvm.devices, $rootScope.deviceFilter), function (d) {
                            return d.id;
                        });
                        if ($rootScope.deviceFilter != "") {
                            highlightDevices(null, devices);
                        } else {
                            resetAll();
                        }
                    }
                });

                $scope.toggleActiveNodeVisibility = function () {
                    $scope.showInactive = !$scope.showInactive;
                };

                $scope.resetModel = function () {
                    websockets.publish("/nvm/reset", null, function () {
                        toastr.success("Successfully reset NVM.");
                    });
                };

                $scope.showHelp = function () {
                    $modal.open({
                        templateUrl: "/templates/topology/sdn-topology-help",
                        resolve: {},
                        size: "md",
                        controller: function ($scope, $modalInstance) {
                            $scope.close = function () {
                                $modalInstance.dismiss('cancel');
                            };
                        }
                    });
                };

                // D3.js Force-Layout Configuration and Behaviour
                var linkStrengthMax = 1;
                var w, h;
                var mapNode, mapInner, svg;
                var nodeSelection, linkSelection, tooltip;
                var polygonBase = "1.16,0 0.58,1.0 -0.58,1.0 -1.16,0.0 -0.58,-1.0 0.58,-1.0";

                var force = d3.layout.force()
                    .friction(.8)
                    .linkDistance(1)
                    .linkStrength(function (d) {
                        return ($scope.showInactive || d.link.active) ? 1 : 0;
                    });

                var nodeCollection = force.nodes();
                var linkCollection = force.links();

                var tick = function () {
                    nodeSelection.attr("transform", function (d) {
                        return "translate(" + topology.boundingBox(d.x, w) + "," + topology.boundingBox(d.y, h) + ")";
                    });
                    linkSelection
                        .attr("x1", function (d) {
                            return topology.boundingBox(d.source.x, w);
                        })
                        .attr("y1", function (d) {
                            return topology.boundingBox(d.source.y, h);
                        })
                        .attr("x2", function (d) {
                            return topology.boundingBox(d.target.x, w);
                        })
                        .attr("y2", function (d) {
                            return topology.boundingBox(d.target.y, h);
                        });
                };
                force.on("tick", tick);

                var resize = function () {
                    w = mapNode.width();
                    h = $scope.height || 300;
                    force.size([w, h]);
                    svg.attr({"width": w, "height": h});
                };

                var setMaxStrength = function (val) {
                    linkStrengthMax = Math.max(val, 1);
                };

                // Node and Link Styling
                var styleNode = function (collection) {
                    collection = collection.transition(defaults.animationDuration);
                    collection.style("opacity", 1);
                    if ($scope.styles && $scope.styles.node) {
                        collection = $scope.styles.node(collection);
                    } else {
                        collection = topology.defaultShapeStyle(collection);
                    }
                    collection.filter(function (d) {
                        return d.highlight;
                    }).style({
                        "stroke": defaults.colors.highlight,
                        "fill": defaults.colors.highlight
                    });
                    collection.filter(function (d) {
                        return d.blur === true;
                    }).style("opacity", defaults.blurOpacity);
                    return collection;
                };

                var styleLink = function (collection) {
                    collection = collection.transition(defaults.animationDuration);
                    collection.style("opacity", 1);
                    if ($scope.styles && $scope.styles.link) {
                        collection = $scope.styles.link(collection, linkStrengthMax);
                    } else {
                        collection = topology.defaultLinkStyle(collection, linkStrengthMax);
                    }
                    collection.filter(function (d) {
                        return d.highlight;
                    }).style({
                        "stroke": defaults.colors.highlight
                    });
                    collection.filter(function (d) {
                        return d.blur === true;
                    }).style("opacity", defaults.blurOpacity);

                    return collection;
                };

                var redrawLinks = function () {
                    if (linkSelection) {
                        var visibleLinks = _.filter(linkCollection, function (d) {
                            return $scope.showInactive || d.link.active;
                        });

                        linkSelection = linkSelection.data(visibleLinks, function (d) {
                            return d.id;
                        });
                        linkSelection.exit().remove();
                        var linkElements = linkSelection.enter().insert("line", ".node");
                        linkSelection
                            .attr("class", function (d) {
                                return "link " + d.type;
                            })
                            .on("contextmenu", function (d) {
                                router.navigate("/detail/link/" + d.id);
                                d3.event.preventDefault();
                            });
                        styleLink(linkSelection);
                        addTooltipToElement(linkElements, "Link");
                    }
                };

                var addTooltipToElement = function (items, type) {
                    items
                        .on("mouseover", function (obj) {
                            tooltip.style("opacity", 0.9);
                            tooltip.html("");
                            if (type == "Node") {
                                defaults.nodeTooltip(obj, tooltip);
                            } else if (type == "Link") {
                                defaults.linkTooltip(obj, tooltip);
                            }
                        })
                        .on("mousemove", function (d) {
                            var topologyWidth = mapNode.width();
                            var tooltipWidth = $(tooltip.node()).width();
                            var tooltipHeight = $(tooltip.node()).height();

                            var x = (type == "Node") ? d.x : ((d.source.x + d.target.x) / 2);
                            var y = (type == "Node") ? d.y : ((d.source.y + d.target.y) / 2);
                            x += $scope.currentSize - tooltipWidth / 2;
                            y += $scope.currentSize - tooltipHeight / 2;

                            tooltip
                                .style("left", function () {
                                    return Math.min(x, topologyWidth - tooltipWidth) + "px";
                                })
                                .style("top", y + "px");
                        })
                        .on("mouseout", function (d) {
                            tooltip.style("opacity", 0);
                        });
                };

                var resizeNode = function (d, th) {
                    var base = d3.select(th);
                    base.selectAll("circle").remove();
                    base.selectAll("polygon").remove();
                    base.selectAll("rect").remove();
                    base.selectAll("text").attr("font-size", $scope.currentSize);
                    var selection = [];
                    if (d.fixed) {
                        var rd = 3;
                        selection = base.insert("rect", "text")
                            .attr("x", -$scope.currentSize)
                            .attr("y", -$scope.currentSize)
                            .attr("rx", rd)
                            .attr("ry", rd)
                            .attr("width", $scope.currentSize * 2)
                            .attr("height", $scope.currentSize * 2);
                    } else {
                        if(d.device.type === sdn.Host.type)
                        {
                            selection = base.insert("circle", "text").attr("r", $scope.currentSize);
                        } else {
                            selection = base.insert("polygon", "text").attr("points", $scope.polygonShape);
                        }
                    }
                    styleNode(selection);
                };

                var redrawNodes = function () {
                    if (nodeSelection) {
                        var visibleNodes = _.filter(nodeCollection, function (d) {
                            return $scope.showInactive || d.device.active;
                        });
                        nodeSelection = nodeSelection.data(visibleNodes, function (d) {
                            return d.id;
                        });
                        nodeSelection.exit().remove();

                        var groups = nodeSelection.enter().append("g")
                            .attr("class", "node")
                            .attr("width", $scope.currentSize)
                            .attr("height", $scope.currentSize)
                            .on("dblclick", function (d) {
                                d.fixed = !d.fixed;
                                resizeNode(d, this);
                                d3.select(this).classed("fixed", d.fixed);
                                force.start();
                            }).on("contextmenu", function (d) {
                                router.navigate("/detail/device/" + d.id);
                                d3.event.preventDefault();
                            })
                            .call(force.drag);

                        groups.append("circle").attr("r", $scope.currentSize);
                        groups.append("text").attr("font-size", $scope.currentSize);

                        addTooltipToElement(groups, "Node");

                        var t = svg.selectAll(".node");
                        styleNode(t.selectAll("circle"));
                        styleNode(t.selectAll("polygon"));
                        styleNode(t.selectAll("rect"));

                        var texts = t.selectAll("text");
                        if ($scope.styles && $scope.styles.text) {
                            $scope.styles.text(texts);
                        } else {
                            topology.defaultTextStyle(texts);
                        }
                    }
                };

                var restart = function () {
                    redrawLinks();
                    redrawNodes();
                    force.start();
                };

                // Update Handling
                var updateHandler = function (event, message) {
                    if (!isDataInitialized) {
                        return;
                    }

                    var change = message.changes;

                    if ((!change[objectDiff.token.changed]) || (!change[objectDiff.token.value].devices && !change[objectDiff.token.value].links)) {
                        return;
                    }

                    if (change[objectDiff.token.changed] && change[objectDiff.token.value].flows && change[objectDiff.token.value].flows[objectDiff.token.changed]) {
                        resetAll();
                    }

                    setMaxStrength($scope.data.nvm && $scope.data.nvm._internals.drMax);

                    var nodeChangeSet = topology.calculateNodeChangeSet(change, nodeCollection);
                    var linkChangeSet = topology.calculateLinkChangeSet(change, linkCollection);

                    linkChangeSet.remove.forEach(function (link) {
                        linkCollection.splice(linkCollection.indexOf(link), 1);
                    });

                    nodeChangeSet.remove.forEach(function (node) {
                        nodeCollection.splice(nodeCollection.indexOf(node), 1);
                    });

                    nodeChangeSet.add.forEach(function (node) {
                        nodeCollection.push(node);
                    });

                    linkChangeSet.add.forEach(function (link) {
                        link.source = _.find(nodeCollection, function (dt) {
                            return dt.id === link.source;
                        });
                        link.target = _.find(nodeCollection, function (dt) {
                            return dt.id === link.target;
                        });
                        linkCollection.push(link);
                    });

                    if (nodeChangeSet.changed || linkChangeSet.changed) {
                        restart();
                    }
                };

                var subscribeToUpdates = function () {
                    messenger.subscribe({
                        topic: "modelUpdate",
                        callback: function (event, message) {
                            if (isDataInitialized) {
                                _.remove(linkCollection);
                                _.remove(nodeCollection);
                                isDataInitialized = false;
                            }
                            initializeData();
                        }
                    });
                    messenger.subscribe({
                        topic: "modelUpdateDiff",
                        callback: updateHandler
                    });
                    messenger.subscribe({
                        topic: "/topology/device/highlight",
                        callback: function (device) {
                            highlightDevices([device]);
                        }
                    });
                    messenger.subscribe({
                        topic: "/topology/device/blur",
                        callback: resetAll
                    });
                    messenger.subscribe({
                        topic: "/topology/link/highlight",
                        callback: highlightLink
                    });
                    messenger.subscribe({
                        topic: "/topology/link/blur",
                        callback: resetAll
                    });
                    messenger.subscribe({
                        topic: "/topology/flow/highlight",
                        callback: highlightFlow
                    });
                    messenger.subscribe({
                        topic: "/topology/flow/blur",
                        callback: resetAll
                    })
                };

                // Bootstrapping Visualization and Data
                var initializeData = function () {
                    if (!isDataInitialized) {
                        $scope.data = repository.data;

                        var nvm = repository.data.nvm;
                        if (nvm) {
                            setMaxStrength((nvm && nvm._internals && nvm._internals.drMax) || 1);

                            var devices = {};
                            nvm.devices.forEach(function (d) {
                                var device = {id: d.id, name: d.name, device: d, x: w / 2, y: h / 2};
                                nodeCollection.push(device);
                                devices[d.id] = device;
                            });

                            nvm.links.forEach(function (d) {
                                var source = devices[d.srcHost.id];
                                var target = devices[d.dstHost.id];
                                if (source && target) {
                                    linkCollection.push({
                                        id: d.id,
                                        source: source,
                                        target: target,
                                        type: d.type,
                                        link: d,
                                        dr: (d.srcTx + d.srcRx + d.dstTx + d.dstRx)
                                    });
                                }
                            });
                        }
                        isDataInitialized = true;
                    }
                };

                var highlightDevices = function (event, devices) {
                    nodeCollection.forEach(function (d) {
                        if (!_.contains(devices, d.id)) {
                            d.blur = true;
                        }
                    });
                    linkCollection.forEach(function (d) {
                        d.blur = true;
                    });
                    redrawNodes();
                    redrawLinks();
                };

                var highlightLink = function (event, link) {
                    linkCollection.forEach(function (d) {
                        if (d.id !== link) {
                            d.blur = true;
                        }
                    });
                    var parts = link.split(".");
                    var src = parts[0].split("-")[0];
                    var dst = parts[1].split("-")[0];
                    nodeCollection.forEach(function (d) {
                        if (d.id != src && d.id != dst) {
                            d.blur = true;
                        }
                    });
                    redrawNodes();
                    redrawLinks();
                };

                var highlightFlow = function (event, flow) {
                    linkCollection.forEach(function (d) {
                        var lnk = _.find(flow.links, function (dd) {
                            return d.link.id == dd.linkId;
                        });
                        if (lnk) {
                            d.highlight = true;
                            d.direction = lnk.direction;
                        } else {
                            d.blur = true;
                        }
                    });
                    nodeCollection.forEach(function (d) {
                        var dvc = _.find(flow.entries, function (dd) {
                            return d.device.id == dd.deviceId;
                        });
                        if (!dvc) {
                            d.blur = true;
                        }
                    });
                    redrawLinks();
                    redrawNodes();
                };

                var resetAll = function () {
                    nodeCollection.forEach(function (d) {
                        d.highlight = false;
                        d.blur = false;
                    });
                    linkCollection.forEach(function (d) {
                        d.highlight = false;
                        d.direction = "";
                        d.blur = false;
                    });
                    redrawNodes();
                    redrawLinks();
                };

                var createTopologyMap = function () {
                    if ($scope.styles) {
                        if ($scope.styles.nodeSize) {
                            defaults.nodeSize = $scope.styles.nodeSize;
                        }
                        if ($scope.styles.nodeTooltip) {
                            defaults.nodeTooltip = $scope.styles.nodeTooltip;
                        }
                        if ($scope.styles.linkTooltip) {
                            defaults.linkTooltip = $scope.styles.linkTooltip;
                        }
                    }

                    $scope.currentSize = defaults.nodeSize * $scope.zoomFactor;
                    $scope.polygonShape = polygonBase;

                    mapNode = angular.element($scope.element).find(".map");
                    mapInner = angular.element($scope.element).find(".mapInner");

                    svg = d3.select(mapInner.get(0)).append("svg");

                    tooltip = d3.select(mapNode.get(0)).append("div").attr("class", "topology-tooltip").style("opacity", 0);

                    nodeSelection = svg.selectAll(".node");
                    linkSelection = svg.selectAll(".link");

                    var scaleNumber = function (d) {
                        return (parseFloat(d) * $scope.currentSize).toFixed(3);
                    };
                    var scalePoint = function (d) {
                        return _.map(d.split(","), scaleNumber).join(",");
                    };
                    $scope.$watch("currentSize", function () {
                        $scope.polygonShape = _.map(polygonBase.split(" "), scalePoint).join(" ");

                        force.charge($scope.currentSize * -120);
                        nodeSelection.each(function (d) {
                            resizeNode(d, this);
                        });
                        redrawLinks();
                        redrawNodes();
                        restart();
                    });

                    svg.call(d3.behavior.zoom().scale($scope.zoomFactor).scaleExtent([0.75, 2]).on("zoom", function () {
                        $scope.zoomFactor = d3.event.scale;
                        $scope.$digest();
                    }));

                    messenger.publish.viewActive({
                        canLeaveCallback: function () {
                            return true;
                        },
                        leaveCallback: function () {
                            $(window).off("resize", resize);
                        }
                    });

                    initializeData();
                    $(window).on("resize", resize);
                    resize();

                    subscribeToUpdates();
                    restart();
                };

                var readyHandlerUnregister = $scope.$watch("element", function () {
                    if (!isMapCreated && $scope.element) {
                        createTopologyMap();
                        readyHandlerUnregister();
                    }
                });
            }
        };
    });
})(window.sdnViz);