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

    sdnViz.directive("sdnReportLinkReliabilityStatistics", function (topology) {
        return {
            replace: true,
            restrict: "E",
            templateUrl: "/templates/reports/LinkReliabilityStatistics/sdn-report-link-reliability-statistics",
            compile: function () {
                return function (scope, element) {
                    scope.element = element.find(".graph")[0];
                };
            },
            controller: function ($scope, $location, messenger, repository) {
                var linksSeries = {};

                var colors = {
                    "unreliable": "#d73027",
                    "reliable": "#66bd63"
                };
                var colorScale = d3.scale.linear().domain([0, 1]).range([colors.unreliable, colors.reliable]);

                $scope.pc0 = colors.unreliable;
                $scope.pc25 = colorScale(0.25);
                $scope.pc50 = colorScale(0.5);
                $scope.pc75 = colorScale(0.75);
                $scope.pc100 = colors.reliable;


                var linkWidth = 30;
                var percentageWidth = 50;

                var leftMargin = linkWidth + 1 + percentageWidth;
                var bottomMargin = 0;
                var seriesHeight = 15;
                var textOffset = seriesHeight / 2;

                var buildBars = function (row, blockWidth, seriesHeight, leftMargin, colors) {
                    row.selectAll("rect.sample")
                        .data(function (d) {
                            return d.data;
                        })
                        .enter()
                        .append("rect")
                        .classed("sample", true)
                        .attr({
                            "width": blockWidth + 1,
                            "height": seriesHeight - 1,
                            "transform": function (d, i) {
                                return "translate(" + (leftMargin + i * blockWidth) + ",0)";
                            }
                        })
                        .style({
                            "fill": function (d) {
                                return colorScale(d);
                            }
                        });
                };

                var styleText = function (texts) {
                    texts.attr({
                        "text-anchor": "end"
                    }).style({
                        "fill": "black",
                        "font-size": "10px",
                        "alignment-baseline": "middle",
                        "text-anchor": "right"
                    });
                };

                var buildReliabilityColumn = function (rows) {
                    var reliability_column = rows.append("g").attr({"transform": "translate(" + linkWidth + ", 0)"});
                    reliability_column.append("rect")
                        .attr({
                            "width": percentageWidth + "px",
                            "height": (seriesHeight - 1) + "px"
                        })
                        .style("fill", function (d) {
                            return colorScale(d.ratio);
                        });

                    var reliability_ratio = reliability_column.append("text")
                        .text(function (d) {
                            return (d.ratio * 100).toFixed(2) + "%"
                        })
                        .attr({"transform": "translate(" + (percentageWidth - 3) + ", " + textOffset + ")"});
                    styleText(reliability_ratio);
                    reliability_ratio.style({"fill": "white"});
                };

                var buildIdColumn = function (rows) {
                    var id_column = rows.append("text").text(function (d) {
                            return d.id
                        })
                            .attr({
                                "transform": "translate(" + (linkWidth - 3) + ", " + textOffset + ")",
                                "width": linkWidth + "px"
                            })
                            .style({
                                "font-weight": "bold"
                            })
                            .on("click", function (d) {
                                $location.path("/detail/link/" + d.link_id);
                            })
                            .on("mouseover", function (d) {
                                messenger.publish("/topology/link/highlight", d.link_id);
                            })
                            .on("mouseout", function () {
                                messenger.publish("/topology/link/blur");
                            })

                        ;
                    styleText(id_column);
                };

                $scope.$watch("content", function () {
                    var chartHeight = $scope.content.linkSeries.length * seriesHeight;
                    var chartWidth = $($scope.element).parent().width();
                    var blockWidth = Math.max((chartWidth - leftMargin) / $scope.content.timestamps.length, 1);

                    var svg = d3.select($scope.element).append("svg").attr({
                        "width": chartWidth,
                        "height": chartHeight
                    });

                    var rows = svg.selectAll("g.link").data($scope.content["linkSeries"]).enter()
                        .append("g")
                        .classed("link", true)
                        .attr("transform", function (d, i) {
                            return "translate(0, " + i * seriesHeight + ")";
                        });

                    buildIdColumn(rows);
                    buildReliabilityColumn(rows);
                    buildBars(rows, blockWidth, seriesHeight, leftMargin, colors);

                    for (var i = 0; i < $scope.content.linkSeries.length; i++) {
                        var linkSeries = $scope.content.linkSeries[i];
                        linksSeries[linkSeries.link_id] = linkSeries.ratio;
                    }
                });

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
                                if (linksSeries[d.id]) {
                                    return colorScale(linksSeries[d.id]);
                                }
                                return "#CCC";
                            }
                        });
                        return links;
                    }
                };
            },
            scope: {
                content: "="
            }
        }
    });
})(window.sdnViz);