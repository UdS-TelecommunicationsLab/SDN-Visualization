(function (sdnViz) {
    "use strict";

    sdnViz.factory("topology", function (packetLossRateFilter, delayFilter) {
        var defaultParameters = {
            nodeRadius: 16,
            heightMargin: 340,
            minHeight: 400,
            animationDuration: 500,
            iconFontSize: 16,
            inactiveOpacity: 0.25
        };

        var boundingBox = function (actualValue, maxValue) {
            var minValue = defaultParameters.nodeRadius + 2;
            return Math.min(maxValue - minValue, Math.max(actualValue, minValue));
        };

        var colors = {flowLink: "#ffb800", openFlowLink: "#006fa2", cableLink: "#666", unknownLink: "#444"};

        var style = function (shape) {
            shape.transition(defaultParameters.animationDuration)
                .style({
                    "fill": function (d) {
                        return d.device.color;
                    },
                    "opacity": function (d) {
                        return d.device.active ? 1.0 : defaultParameters.inactiveOpacity
                    },
                    "stroke": function (d) {
                        return d3.rgb(d.device.color).darker(1);
                    }
                });
            return shape;
        };

        var createNodeTooltip = function (obj) {
            var html = "<div><strong>" + ((obj.id !== obj.device.name) ? obj.device.name : "Unknown Device") + "</strong> ";
            if (obj.device.type == sdn.Client.type)
                html += "<span>(" + obj.device.interface.address + ")</span>";
            html += "<br /><code class='dp'>" + obj.id + "</code></div>";
            return html;
        };

        var createLinkTooltip = function (tt, obj) {
            var div = tt.append("div");
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

        return {
            boundingBox: boundingBox,
            colors: colors,
            createLinkTooltip: createLinkTooltip,
            createNodeTooltip: createNodeTooltip,
            defaultParameters: defaultParameters,
            defaultShapeStyle: style

        };
    });

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
            scope: {},
            controller: function ($scope, $modal, router, deviceTypeIconFilter, repository, messenger, topology) {
                $scope.loaded = false;

                $scope.showHelp = function () {
                    $modal.open({
                        templateUrl: "/templates/topology/sdn-topology-help",
                        resolve: {},
                        size: "sm",
                        controller: function ($scope, $modalInstance) {
                            $scope.close = function () {
                                $modalInstance.dismiss('cancel');
                            };
                        },
                        backdrop: true
                    })
                };

                var linkStrengthMax = 1;
                var w, h;

                var force = d3.layout.force()
                    .friction(.8)
                    .charge(-1200)
                    .linkDistance(1)
                    .linkStrength(1);

                var createTopologyMap = function () {
                    var mapNode = angular.element($scope.element).find(".map");
                    var mapInner = angular.element($scope.element).find(".mapInner");
                    var svg = d3.select(mapInner.get(0)).append("svg");

                    var tooltip = d3.select(mapNode.get(0)).append("div").attr("class", "topology-tooltip").style("opacity", 0);

                    // ------------------------------ BORDER ------------------------------

                    var nodeCollection = force.nodes();
                    var linkCollection = force.links();

                    var nodeSelection = svg.selectAll(".node");
                    var linkSelection = svg.selectAll(".link");

                    force.on("tick", function () {
                        nodeSelection.attr("transform", function (d) {
                            return "translate(" + topology.boundingBox(d.x, w) + "," + topology.boundingBox(d.y, h) + ")";
                        });

                        linkSelection.attr("x1", function (d) {
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

                        if (force.alpha() < 0.02) {
                            showTopology();
                        }
                    });

                    var resize = function () {
                        w = mapNode.width();
                        h = Math.max($(window).height() - topology.defaultParameters.heightMargin, topology.defaultParameters.minHeight);
                        force.size([w, h]);
                        svg.attr({"width": w, "height": h});
                    };

                    var setMaxStrength = function (val) {
                        linkStrengthMax = Math.max(val, 1);
                    };

                    var showTopology = function () {
                        if (nodeCollection.length == 0) {
                            return;
                        }

                        if (!$scope.loaded) {
                            mapInner.slideDown(1000);
                            force.alpha(0.1);
                        }

                        $scope.loaded = true;
                        $scope.$digest();
                    };

                    var hideTopology = function () {
                        $scope.loaded = false;
                        mapInner.slideUp(1000);
                    };

                    var redrawLinks = function () {
                        linkSelection = linkSelection.data(linkCollection, function (d) {
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
                            })
                            .transition().duration(topology.defaultParameters.animationDuration)
                            .style({
                                "stroke": function (d) {
                                    if (d.flowHighlight) return topology.colors.flowLink;
                                    else if (d.type == "OpenFlow") return topology.colors.openFlowLink;
                                    else if (d.type == "Ethernet") return topology.colors.cableLink;
                                    else return topology.colors.unknownLink;
                                },
                                "opacity": function (d) {
                                    return d.link.active ? 1.0 : topology.defaultParameters.inactiveOpacity / 2
                                }
                            })
                            .transition().duration(topology.defaultParameters.animationDuration)
                            .style("stroke-width", function (d) {
                                return Math.min((d.dr / (2 * linkStrengthMax) * 7 + 3), 10) + "px";
                            });

                        addTooltipToElement(linkElements, "Link");
                    };

                    var styleShape = topology.defaultShapeStyle;

                    var redrawNodes = function () {
                        nodeSelection = nodeSelection.data(nodeCollection, function (d) {
                            return d.id;
                        });

                        nodeSelection.exit().remove();

                        var iconType = "text";

                        var groups = nodeSelection.enter().append("g")
                            .attr("class", "node")
                            .attr("width", topology.defaultParameters.nodeRadius)
                            .attr("height", topology.defaultParameters.nodeRadius)
                            .on("dblclick", function (d) {
                                d.fixed = !d.fixed;
                                if (d.fixed) {
                                    var rd = 3;
                                    d3.select(this).selectAll("circle").remove();
                                    styleShape(d3.select(this).insert("rect", iconType)
                                        .attr("x", -topology.defaultParameters.nodeRadius)
                                        .attr("y", -topology.defaultParameters.nodeRadius)
                                        .attr("rx", rd)
                                        .attr("ry", rd)
                                        .attr("width", topology.defaultParameters.nodeRadius * 2)
                                        .attr("height", topology.defaultParameters.nodeRadius * 2));
                                } else {
                                    d3.select(this).selectAll("rect").remove();
                                    styleShape(d3.select(this).insert("circle", iconType)
                                        .attr("r", topology.defaultParameters.nodeRadius));
                                }

                                d3.select(this).classed("fixed", d.fixed);
                                force.start();
                            }).on("contextmenu", function (d) {
                                router.navigate("/detail/device/" + d.id);
                                d3.event.preventDefault();
                            })
                            .call(force.drag);

                        groups.append("circle").attr("r", topology.defaultParameters.nodeRadius);
                        groups.append(iconType).attr("font-size", topology.defaultParameters.iconFontSize);

                        addTooltipToElement(groups, "Node");

                        var t = svg.selectAll(".node");
                        styleShape(t.selectAll("circle"));
                        styleShape(t.selectAll("rect"));
                        t.selectAll(iconType)
                            .text(function (d) {
                                return deviceTypeIconFilter(d.device.deviceType);
                            });

                        if (nodeCollection.length == 0) {
                            hideTopology();
                        }
                    };

                    var restart = function () {
                        redrawLinks();
                        redrawNodes();
                        force.start();
                    };

                    var addTooltipToElement = function (items, type) {
                        items
                            .on("mouseover", function (obj) {
                                tooltip.style("opacity", 0.9);
                                tooltip.html("");
                                if (type == "Node") {
                                    tooltip.html(topology.createNodeTooltip(obj));
                                } else if (type == "Link") {
                                    topology.createLinkTooltip(tooltip, obj);
                                }
                            })
                            .on("mousemove", function (d) {
                                var topologyWidth = mapNode.width();
                                var tooltipWidth = $(tooltip.node()).width();
                                var tooltipHeight = $(tooltip.node()).height();

                                var x = (type == "Node") ? d.x : ((d.source.x + d.target.x) / 2);
                                var y = (type == "Node") ? d.y : ((d.source.y + d.target.y) / 2);
                                x += topology.defaultParameters.nodeRadius - tooltipWidth / 2;
                                y += topology.defaultParameters.nodeRadius - tooltipHeight / 2;

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

                    var updateDiff = function (event, message) {
                        if (!initialized) {
                            return;
                        }

                        var changed = false;
                        var nodeChanged = false;
                        var change = message.changes;


                        if ((!change[objectDiff.token.changed]) || (!change[objectDiff.token.value].devices && !change[objectDiff.token.value].links)) {
                            return;
                        }

                        if (change[objectDiff.token.changed] && change[objectDiff.token.value].flows && change[objectDiff.token.value].flows[objectDiff.token.changed]) {
                            unhighlightAll();
                        }

                        setMaxStrength($scope.data.nvm && $scope.data.nvm._internals.drMax);

                        var nodeManipul = {add: [], remove: []};

                        var localDevices = (change[objectDiff.token.value].devices && change[objectDiff.token.value].devices[objectDiff.token.value]) || [];
                        for (var deviceIndex in localDevices) {
                            var nodeChange = localDevices[deviceIndex];
                            if (nodeChange !== undefined && nodeChange[objectDiff.token.changed] !== objectDiff.token.equal) {
                                if (nodeChange[objectDiff.token.changed] === objectDiff.token.added) {
                                    changed = true;
                                    nodeManipul.add.push({
                                        id: nodeChange[objectDiff.token.value].id,
                                        name: nodeChange[objectDiff.token.value].name,
                                        device: nodeChange[objectDiff.token.value],
                                        x: w / 2,
                                        y: h / 2
                                    });
                                } else if (nodeChange[objectDiff.token.changed] === objectDiff.token.object) {
                                    nodeChanged = true;
                                    var changedNode = _.find(nodeCollection, function (lclN) {
                                        return lclN.id == nodeChange[objectDiff.token.value].id[objectDiff.token.value];
                                    });
                                    if (changedNode) {
                                        repository.applyChanges(changedNode.device, nodeChange);
                                    }
                                } else if (nodeChange[objectDiff.token.changed] === objectDiff.token.removed) {
                                    changed = true;
                                    var removeNode = _.find(nodeCollection, function (d) {
                                        return d.id == nodeChange[objectDiff.token.value].id;
                                    });
                                    if (removeNode) {
                                        nodeManipul.remove.push(removeNode);
                                    }
                                }
                            }
                        }

                        var linkManipul = {add: [], remove: [], changed: false, linkChanged: false};
                        var localLinks = (change[objectDiff.token.value].links && change[objectDiff.token.value].links[objectDiff.token.value]) || [];
                        for (var linkIndex in localLinks) {
                            var linkChange = localLinks[linkIndex];
                            if (linkChange[objectDiff.token.changed] !== objectDiff.token.equal) {
                                if (linkChange[objectDiff.token.changed] === objectDiff.token.added) {
                                    linkManipul.changed = true;
                                    var localLink = linkChange[objectDiff.token.value];
                                    linkManipul.add.push({
                                        id: localLink.id,
                                        source: localLink.srcHost.id,
                                        target: localLink.dstHost.id,
                                        type: localLink.type,
                                        link: localLink,
                                        dr: (localLink.drTx + localLink.drRx)
                                    });
                                } else if (linkChange[objectDiff.token.changed] === objectDiff.token.object) {
                                    linkManipul.linkChanged = true;
                                    var changedLink = _.find(linkCollection, function (lclL) {
                                        return lclL.id == linkChange[objectDiff.token.value].id[objectDiff.token.value];
                                    });
                                    if (changedLink) {
                                        repository.applyChanges(changedLink.link, linkChange);
                                        changedLink.dr = (changedLink.link.drTx + changedLink.link.drRx);
                                    }
                                } else if (linkChange[objectDiff.token.changed] === objectDiff.token.removed) {
                                    linkManipul.changed = true;
                                    var removeLink = _.find(linkCollection, function (lclL) {
                                        return lclL.id == linkChange[objectDiff.token.value].id;
                                    });
                                    if (removeLink)
                                        linkManipul.remove.push(removeLink);
                                }
                            }
                        }

                        // process changes
                        linkManipul.remove.forEach(function (link) {
                            linkCollection.splice(linkCollection.indexOf(link), 1);
                        });

                        nodeManipul.remove.forEach(function (node) {
                            nodeCollection.splice(nodeCollection.indexOf(node), 1);
                        });

                        nodeManipul.add.forEach(function (node) {
                            nodeCollection.push(node);
                        });

                        linkManipul.add.forEach(function (link) {
                            link.source = _.find(nodeCollection, function (dt) {
                                return dt.id === link.source;
                            });
                            link.target = _.find(nodeCollection, function (dt) {
                                return dt.id === link.target;
                            });
                            linkCollection.push(link);
                        });

                        if (changed || linkManipul.changed) {
                            restart();
                        } else if (linkManipul.linkChanged || nodeChanged) {
                            redrawLinks();
                            redrawNodes();
                        }
                    };


                    var subscribeToUpdates = function () {
                        messenger.subscribe({
                            topic: "modelUpdate",
                            callback: function (event, message) {
                                if (initialized) {
                                    hideTopology();
                                    nodeCollection.splice(0, nodeCollection.length);
                                    linkCollection.splice(0, linkCollection.length);
                                    initialized = false;
                                }
                                set();
                            }
                        });

                        messenger.subscribe({
                            topic: "modelUpdateDiff",
                            callback: updateDiff
                        });
                    };

                    /* Flow highlighting */
                    var unhighlightAll = function () {
                        linkCollection.forEach(function (d) {
                            d.flowHighlight = false;
                        });
                        redrawLinks();
                    };

                    $scope.highlightFlow = function (flow) {
                        linkCollection.forEach(function (d) {
                            if (_.contains(flow.path, d.source.id) && _.contains(flow.path, d.target.id)) {
                                d.flowHighlight = true;
                            }
                        });

                        redrawLinks();
                    };
                    $scope.unhighlightFlow = unhighlightAll;

                    var initialized = false;

                    var set = function () {
                        if (!initialized) {
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
                                    linkCollection.push({
                                        id: d.id,
                                        source: devices[d.srcHost.id],
                                        target: devices[d.dstHost.id],
                                        type: d.type,
                                        link: d,
                                        dr: (d.drTx + d.drRx)
                                    });
                                });
                            }

                            initialized = true;
                        }
                    };
                    // ------------------------------ BORDER ------------------------------


                    messenger.publish.viewActive({
                        canLeaveCallback: function () {
                            return true;
                        },
                        leaveCallback: function () {
                            $(window).off("resize", resize);
                        }
                    });

                    set();

                    $(window).on("resize", resize);
                    resize();

                    subscribeToUpdates();

                    force.on("end", function () {
                        showTopology();
                    });

                    restart();
                };

                var created = false;
                $scope.$watch("element", function () {
                    if (!created && $scope.element) {
                        createTopologyMap();
                    }
                });
            }
        };
    });

})(window.sdnViz);