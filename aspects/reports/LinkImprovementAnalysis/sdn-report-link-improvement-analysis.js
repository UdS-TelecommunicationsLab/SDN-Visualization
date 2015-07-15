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

    sdnViz.directive("sdnReportLinkImprovementAnalysis", function () {
        return {
            replace: true,
            restrict: "E",
            templateUrl: "/templates/reports/LinkImprovementAnalysis/sdn-report-link-improvement-analysis",
            compile: function () {
                return function (scope, element) {
                    scope.element = element.find(".graph")[0];
                };
            },
            controller: function ($scope, messenger, repository) {
                $scope.formula = "Index = Centrality \\cdot (1 - Reliability)";
                $scope.series = [];
                $scope.lookup = {};

                $scope.collapseCalculation = true;

                $scope.toggleEdit = function() {
                    $scope.collapseCalculation = !$scope.collapseCalculation;
                };

                $scope.indexExtent = [0.0, 1.0];

                $scope.centrality_max = 0.0;

                var colorScale = d3.scale.linear().domain($scope.indexExtent).range(["#2c7bb6", "#d7191c"]);
                $scope.pc0 = colorScale(0);
                $scope.pc50 = colorScale(0.5);
                $scope.pc100 = colorScale(1);
                $scope.colorScale = colorScale;

                $scope.blur = function() {
                    messenger.publish("/topology/link/blur");
                };

                $scope.highlight = function(link) {
                    messenger.publish("/topology/link/highlight", link.id);
                };

                $scope.calculate = function () {
                    $scope.series = [];
                    $scope.lookup = {};
                    $scope.centrality_max = $scope.content.centrality_max;

                    var indexes = [];

                    for (var i = 0; i < $scope.content.series.length; i++) {
                        var link = $scope.content.series[i];
                        var normalized_centrality = _.map(link.centrality, function (d) {
                            return d / $scope.centrality_max;
                        });
                        var centrality = d3.mean(normalized_centrality);
                        var centralitySDev = d3.deviation(normalized_centrality);
                        var reliability = d3.mean(link.reliability);
                        var reliabilitySDev = d3.deviation(link.reliability);
                        var index = centrality * (1 - reliability);
                        indexes.push(index);

                        $scope.series.push({
                            id: link.link_id,
                            link: repository.getLinkById(link.link_id).item,
                            centrality: centrality,
                            centralitySDev: centralitySDev,
                            reliability: reliability,
                            reliabilitySDev: reliabilitySDev,
                            index: index
                        });
                        $scope.lookup[link.link_id] = index;
                    }

                    $scope.indexExtent =d3.extent(indexes);
                    colorScale.domain($scope.indexExtent);
                };

                $scope.styles = {
                    node: function (nodes) {
                        nodes.style({
                            "fill": "#DDD",
                            "stroke": "#CCC"
                        });
                        return nodes;
                    },
                    link: function (links) {
                        links.style({
                            "stroke-width": 4,
                            "stroke": function (d) {
                                if ($scope.lookup[d.id]) {
                                    return colorScale($scope.lookup[d.id]);
                                }
                                return "#CCC";
                            }
                        });
                        return links;
                    }
                };

                $scope.$watch("content", $scope.calculate);
            },
            scope: {
                content: "="
            }
        };
    });
})(window.sdnViz);