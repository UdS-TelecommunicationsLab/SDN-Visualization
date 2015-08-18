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

    sdnViz.controller("ReportsCtrl", function ($scope, $http, $routeParams, websockets, toastr) {
        $scope.reports = [];
        $scope.report = {};
        $scope.selectedType = "";
        $scope.mode = "all";

        $scope.running = false;

        $scope.reportTypes = [
            {
                type: "ServiceStatistics",
                name: "Service Statistics",
                description: "Behavioural analysis of services in the network. Includes information about activity, concurrent sessions and used data rates.",
                icon: ["fa-cloud", "fa-pie-chart"]
            }, {
                type: "LinkImprovementAnalysis",
                name: "Link Improvement Analysis",
                description: "Finding links that are unreliable and crucial to the networks operation.",
                icon: ["fa-level-up"]
            }, {
                type: "PathSplitRecommendations",
                name: "Path Split Recommendations",
                description: "Per-node analysis of attached links for inhomogeneous link parameters.",
                icon: ["fa-chain-broken"]
            }, {
                type: "LinkReliabilityStatistics",
                name: "Link Reliability",
                description: "Statistics about link reliability concerning loss behaviour over time.",
                icon: ["fa-heartbeat"]
            }, {
                type: "ServiceUsage",
                name: "Service Usage",
                description: "Depicting which service is consumed by which host and which devices offer this service.",
                icon: ["fa-cloud", "fa-user"]
            }, {
                type: "TopologyCentrality",
                name: "Topology Centrality",
                description: "Displaying different centrality measures of the nodes and links present in the topology.",
                icon: ["fa-globe"]
            }
        ];

        $scope.refresh = function () {
            $http.get("/api/reports/type/" + $routeParams.type).success(function (data) {
                $scope.reports = data;
            });
        };

        $scope.runAnalyzer = function(task) {
            $scope.running = true;
            websockets.publish("/analytics/runAnalyzer", { task: task }, function() {
                toastr.success("Analyzer run successful.");
                $scope.running = false;
                $scope.refresh();
            });
            toastr.info("Analyzer run started.");
        };

        if (!$routeParams.id && !$routeParams.type) {
            $scope.mode = "all";
        } else if ($routeParams.type) {
            $scope.mode = "type";
            $scope.selectedType = _.find($scope.reportTypes, function (r) {
                return r.type === $routeParams.type;
            });

            $scope.refresh();
        } else {
            $scope.mode = "detail";
            $http.get("/api/reports/" + $routeParams.id).success(function (data) {
                $scope.report = data;
                $scope.report.content = angular.fromJson($scope.report.content);
                $scope.selectedType = _.find($scope.reportTypes, function (r) {
                    return r.type === $scope.report.type;
                });
            })
        }
    });
})(window.sdnViz);