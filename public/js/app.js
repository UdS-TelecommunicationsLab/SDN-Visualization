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

"use strict";
var ofvizApp = angular.module("of-viz", ["ui.bootstrap", "colorpicker.module"]);

ofvizApp.config(function($routeProvider, $locationProvider) {
    // Main Views
    $routeProvider.
        when("/topology", {
            templateUrl: "partials/topology",
            controller: "TopologyCtrl"
        }).
        when("/statistics", {
            templateUrl: "partials/statistics",
            controller: "StatisticsCtrl"
        }).
        when("/documentation", {
            templateUrl: "partials/documentation",
            controller: "DocumentationCtrl"
        }).
        when("/configuration", {
            templateUrl: "partials/configuration",
            controller: "ConfigurationCtrl"
        }).
        when("/configuration/addDevice/:id", {
            templateUrl: "partials/configuration",
            controller: "ConfigurationCtrl"
        }).
        when("/about", {
            templateUrl: "partials/about",
            controller: "AboutCtrl"
        }).
        when("/status", {
            templateUrl: "partials/status",
            controller: "StatusCtrl"
        });

    // Detail Views
    $routeProvider.when("/detail/device/:id", {
        templateUrl: "partials/detailDevice",
        controller: "DetailDeviceCtrl"
    });

    $routeProvider.when("/detail/link/:id", {
        templateUrl: "partials/detailLink",
        controller: "DetailLinkCtrl"
    });

    $routeProvider.when("/detail/flow/:id", {
        templateUrl: "partials/detailFlow",
        controller: "DetailFlowCtrl"
    });

    // Fallback
    $routeProvider.otherwise({
        redirectTo: "/topology"
    });

    $locationProvider.html5Mode(true);
});

ofvizApp.run(function($rootScope, router, repository) {
    repository.init();
    router.init();
});