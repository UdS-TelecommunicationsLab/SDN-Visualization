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

"use strict";
var sdnViz = angular.module("sdn-visualization", ["ngRoute","angular-locker","ui.bootstrap", "colorpicker.module"]);

sdnViz.config(function($routeProvider, $locationProvider, lockerProvider) {
    // Main Views
    $routeProvider.
        when("/topology", {
            templateUrl: "templates/pages/topology",
            controller: "TopologyCtrl"
        }).
        when("/statistics/overview", {
            templateUrl: "templates/statistics/overview",
            controller: "StatisticsCtrl",
            controllerAs: "vm"
        }).
        when("/statistics/devices", {
            templateUrl: "templates/statistics/devices",
            controller: "StatisticsCtrl",
            controllerAs: "vm"
        }).
        when("/statistics/links", {
            templateUrl: "templates/statistics/links",
            controller: "StatisticsCtrl",
            controllerAs: "vm"
        }).
        when("/statistics/flows", {
            templateUrl: "templates/statistics/flows",
            controller: "StatisticsCtrl",
            controllerAs: "vm"
        }).
        when("/documentation", {
            templateUrl: "templates/pages/documentation",
            controller: "DocumentationCtrl"
        }).
        when("/configuration", {
            templateUrl: "templates/pages/configuration",
            controller: "ConfigurationCtrl"
        }).
        when("/configuration/addDevice/:id", {
            templateUrl: "templates/pages/configuration",
            controller: "ConfigurationCtrl"
        }).
        when("/about", {
            templateUrl: "templates/pages/about",
            controller: "AboutCtrl"
        }).
        when("/relaying", {
            templateUrl: "templates/relaying/relaying",
            controller: "RelayingCtrl",
            controllerAs: "vm"
        }).
        when("/status", {
            templateUrl: "templates/pages/status",
            controller: "StatusCtrl"
        });

    // Detail Views
    $routeProvider.when("/detail/device/:id", {
        templateUrl: "templates/pages/detailDevice",
        controller: "DetailDeviceCtrl"
    });

    $routeProvider.when("/detail/link/:id", {
        templateUrl: "templates/pages/detailLink",
        controller: "DetailLinkCtrl"
    });

    $routeProvider.when("/detail/flow/:id", {
        templateUrl: "templates/pages/detailFlow",
        controller: "DetailFlowCtrl"
    });

    // Fallback
    $routeProvider.otherwise({
        redirectTo: "/topology"
    });

    $locationProvider.html5Mode(true);

    lockerProvider.setDefaultDriver("session")
        .setDefaultNamespace("sdnViz")
        .setSeparator(".")
        .setEventsEnabled(false);
});

sdnViz.run(function($rootScope, router, repository) {
    repository.init();
    router.init();
});