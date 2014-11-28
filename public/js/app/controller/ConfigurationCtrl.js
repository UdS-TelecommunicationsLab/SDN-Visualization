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

(function(ofvizApp) {
    "use strict";
    ofvizApp.controller("ConfigurationCtrl", function($scope, $http, websockets, $window, toastr, $routeParams, $modal) {
        $scope.latestInteraction = new Date(-8640000000000000);
        $scope.clipboard = { value: "" };

        $scope.dataSources = [
        {
            type: "floodlight",
            title: "Floodlight (HTTP)"
        }, {
            type: "nox",
            title: "NOX (TCP)"
        }];

        var createNewEntry = ($routeParams.id) ? true : false;
        var defaultColor = "#444444";

        var createPattern = function(d) {
            if (d.color === undefined)
                d.color = defaultColor;

            var sub = [];
            var pattern = d.pattern.replace(/:/g, '');
            for (var i = 0; i < 8; i++) {
                sub[i] = pattern.substr(i * 2, 2);
            }
            _.extend(d, { sub: sub });
            return d;
        };

        $scope.configuration = { deviceInformation: [], dataSource: { type: "none" , connectionString: "" } };

        var onConfigLoaded = function(data) {
            $scope.configuration = data.configuration || {};
            $scope.latestInteraction = data.latestInteraction;
            $scope.configuration.deviceInformation = _.map($scope.configuration.deviceInformation, createPattern);

            if (createNewEntry) {
                var currentEntry = _.find($scope.configuration.deviceInformation, function(d) {
                    return d.pattern == $routeParams.id;
                });

                if (currentEntry) {
                    currentEntry.highlight = true;
                } else {
                    $scope.configuration.deviceInformation.splice(1, 0, createPattern({ highlight: true, pattern: $routeParams.id, name: $routeParams.id, color: defaultColor }));
                }

                createNewEntry = false;
            }
        };

        var load = function() {
            $http.get("/api/vizConfiguration?d=" + new Date()).success(onConfigLoaded);
        };

        websockets.subscribe("/configUpdate", function(data) {
            onConfigLoaded(data);
            toastr.info("Configuration was changed.");
        });

        load();

        $scope.exportConfig = function() {
            $window.open("/api/exportVizConfiguration", "_self");
        };

        $scope.moveUp = function(index) {
            if (index > 0) {
                var tmp = $scope.configuration.deviceInformation[index];
                $scope.configuration.deviceInformation[index] = $scope.configuration.deviceInformation[index - 1];
                $scope.configuration.deviceInformation[index - 1] = tmp;
            }
        };

        $scope.moveDown = function(index) {
            if (index < $scope.configuration.deviceInformation.length - 1) {
                var tmp = $scope.configuration.deviceInformation[index];
                $scope.configuration.deviceInformation[index] = $scope.configuration.deviceInformation[index + 1];
                $scope.configuration.deviceInformation[index + 1] = tmp;
            }
        };

        $scope.saveConfiguration = function() {
            var filteredCopy = angular.copy(_.filter($scope.configuration.deviceInformation, function(d) { return d.status != 'blank'; }));
            var res = _.map(filteredCopy, function(d) {
                d.pattern = d.sub.join(":");
                delete d.sub;
                delete d.highlight;
                return d;
            });

            var config = angular.copy($scope.configuration);
            config.deviceInformation = res;

            websockets.publish("/interact/saveVizConfiguration", { latestInteraction: $scope.latestInteraction, configuration: config });
        };

        $scope.cancelPatternEdit = function() {
            $scope.configForm.$setPristine(true);
            load();
        };

        $scope.removePattern = function(pattern) {
            $scope.configuration.deviceInformation.splice($scope.configuration.deviceInformation.indexOf(pattern), 1);
        };

        $scope.addPattern = function() {
            $scope.configuration.deviceInformation.splice(0, 0, createPattern({ pattern: "??:??:??:??:??:??:??:??", name: "New Pattern", type: "Unknown" }));
        };

        $("form[name='configForm']").submit(function(e) {
            e.preventDefault();
            return false;
        });

        $scope.edit = function(device) {
            var modalInstance = $modal.open({
                templateUrl: "/tmpl/of-edit-device",
                controller: "EditDeviceCtrl",
                resolve: {
                    item: function() {
                        return angular.copy(device);
                    }
                }
            });

            modalInstance.result.then(function(item) {
                angular.extend(device, item);
            });
        };
    });

})(window.ofvizApp);