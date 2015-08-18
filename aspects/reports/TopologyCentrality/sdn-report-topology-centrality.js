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

(function (sdnViz) {
    "use strict";
    sdnViz.directive("sdnReportTopologyCentrality", function (numberToFixedFilter, repository) {
        return {
            replace: true,
            restrict: "E",
            templateUrl: "/templates/reports/TopologyCentrality/sdn-report-topology-centrality",
            compile: function () {
                return function (scope, element) {
                    scope.element = element[0];
                };
            },
            controller: function ($scope) {
                var deviceLookup = {};
                var linkLookup = {};

                var deviceBetweennessScale;
                var linkBetweennessScale;
                var closenessScale;
                var degreeScale;

                $scope.maxColor = "#d7191c";
                $scope.minColor = "#2c7bb6";
                $scope.unknownColor = "#D8D8D8";
                var neutralColor = "#CCC";

                $scope.betweennessStyles = {
                    node: function (nodes) {
                        var fill = function (d) {
                            if (deviceLookup[d.id]) {
                                return deviceBetweennessScale(deviceLookup[d.id].betweenness);
                            }
                            return $scope.unknownColor;
                        };
                        nodes.style({
                            "fill": fill,
                            "stroke": fill
                        });
                        return nodes;
                    },
                    nodeTooltip: function(d, tooltip) {
                        var html = "<div><strong>Betweenness:</strong> ";
                        if (deviceLookup[d.id]) {
                            html += numberToFixedFilter(deviceLookup[d.id].betweenness, 5);
                        } else {
                            html += "UNK"
                        }
                        html += "</div>";
                        tooltip.html(html);
                    },
                    link: function (links) {
                        links = links.style({
                            "stroke": function (d) {
                                if (linkLookup[d.id]) {
                                    return linkBetweennessScale(linkLookup[d.id].betweenness);
                                }
                                return neutralColor;
                            },
                            "stroke-width": function (d) {
                                return linkLookup[d.id] ? 5 : 2;
                            }
                        });
                        return links;
                    },
                    linkTooltip: function(d, tooltip) {
                        var html = "<div><strong>Betweenness:</strong> ";
                        if (linkLookup[d.id]) {
                            html += numberToFixedFilter(linkLookup[d.id].betweenness, 5);
                        } else {
                            html += "UNK"
                        }
                        html += "</div>";
                        tooltip.html(html);
                    }
                };

                $scope.closenessStyles = {
                    node: function (nodes) {
                        var fill = function (d) {
                            if (deviceLookup[d.id]) {
                                return closenessScale(deviceLookup[d.id].closeness);
                            }
                            return $scope.unknownColor;
                        };
                        nodes.style({
                            "fill": fill,
                            "stroke": fill
                        });
                        return nodes;
                    },
                    nodeTooltip: function(d, tooltip) {
                        var html = "<div><strong>Closeness:</strong> ";
                        if (deviceLookup[d.id]) {
                            html += numberToFixedFilter(deviceLookup[d.id].closeness, 5);
                        } else {
                            html += "UNK"
                        }
                        html += "</div>";
                        tooltip.html(html);
                    },
                    link: function (links) {
                        return links.style("stroke", neutralColor);
                    },
                    linkTooltip: function() { }
                };

                $scope.degreeStyles = {
                    node: function(nodes) {
                        var fill = function (d) {
                            if (deviceLookup[d.id]) {
                                return degreeScale(deviceLookup[d.id].degree);
                            }
                            return $scope.unknownColor;
                        };
                        nodes.style({
                            "fill": fill,
                            "stroke": fill
                        });
                        return nodes;
                    },
                    nodeTooltip: function(d, tooltip) {
                        var html = "<div><strong>Degree:</strong> ";
                        if (deviceLookup[d.id]) {
                            html += deviceLookup[d.id].degree;
                        } else {
                            html += "UNK"
                        }
                        html += "</div>";
                        tooltip.html(html);
                    },
                    link: function (links) {
                        return links.style("stroke", neutralColor);
                    },
                    linkTooltip: function() { }
                };

                $scope.$watch("content", function () {
                    deviceLookup = $scope.content.devices;
                    linkLookup = $scope.content.links;

                    repository.data.nvm.links.forEach(function(d) {
                        if(linkLookup[d.id] !== undefined) {
                            var foo = _.extend(linkLookup[d.id], d);
                            linkLookup[d.id] = foo;
                            console.log(foo);
                        }
                    });

                    var deviceValues = _.values(deviceLookup).map(function (d) {
                        return [d.betweenness, d.closeness, d.degree];
                    });

                    $scope.degree = d3.extent(deviceValues.map(function(d) { return d[2]}));
                    $scope.nodeBetweenness = d3.extent(deviceValues.map(function(d) { return d[0]}));
                    $scope.linkBetweenness = d3.extent(_.values(linkLookup).map(function (d) { return d.betweenness; }));
                    $scope.closeness = d3.extent(deviceValues.map(function(d) { return d[1]}));

                    var colorRange = [$scope.minColor, $scope.maxColor];

                    deviceBetweennessScale = d3.scale.linear().domain($scope.nodeBetweenness).range(colorRange);
                    $scope.deviceBetweennessScale = deviceBetweennessScale;
                    linkBetweennessScale = d3.scale.linear().domain($scope.linkBetweenness).range(colorRange);
                    $scope.linkBetweennessScale = linkBetweennessScale;
                    closenessScale = d3.scale.linear().domain($scope.closeness).range(colorRange);
                    $scope.closenessScale = closenessScale;
                    degreeScale = d3.scale.linear().domain($scope.degree).range(colorRange);
                    $scope.degreeScale = degreeScale;
                });
            },
            scope: {
                content: "="
            }
        };
    });
})(window.sdnViz);