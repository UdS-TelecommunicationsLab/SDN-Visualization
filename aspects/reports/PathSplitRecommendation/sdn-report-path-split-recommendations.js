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

    sdnViz.directive("sdnReportPathSplitRecommendations", function () {
        return {
            replace: true,
            restrict: "E",
            templateUrl: "/templates/reports/PathSplitRecommendation/sdn-report-path-split-recommendations",
            scope: {
                "content": "="
            },
            controller: function($scope, messenger) {
                $scope.formula = "d_{seuclidean}(u,v) = \\sqrt{\\sum{(u_i-v_i)^2 / V[x_i]}}";


                $scope.colorScale = function() {
                    return "#444";
                };

                $scope.$watch("content.max_distance", function() {
                    $scope.colorScale = d3.scale.linear().domain([0, $scope.content.max_distance]).range(["#2c7bb6", "#d7191c"]);
                });

                $scope.highlight= function(d) {
                    messenger.publish("/topology/device/highlight", d);
                };

                $scope.blur = function() {
                    messenger.publish("/topology/device/blur");
                };
            }
        };
    });
})(window.sdnViz);