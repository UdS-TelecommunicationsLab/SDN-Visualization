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

(function () {
    "use strict";

    angular
        .module("sdn-visualization")
        .controller("StatusCtrl", StatusCtrl);

    StatusCtrl.$inject = ["$window", "repository", "toastr", "websockets"];

    function StatusCtrl($window, repository, toastr, websockets) {
        var vm = this;
        vm.data = repository.data;
        vm.logging = [];
        vm.maxLog = 10;
        vm.newestFirst = true;
        vm.reload = reload;
        vm.clearLog = clearLog;
        vm.resetModel = resetModel;
        vm.enterDebugMode = enterDebugMode;

        var idx = 0;

        activate();

        /////////////
        function activate() {
            websockets.subscribe("/logging/update", function (data) {
                // crop the log
                while (vm.logging.length >= vm.maxLog) {
                    vm.logging.pop();
                }

                // append new data
                vm.logging.push({index: idx++, message: data});
            });
        }

        function reload() {
            $window.location = "/status";
        }

        function clearLog() {
            repository.clearLog();
        }

        function resetModel() {
            websockets.publish("/nvm/reset", null, function () {
                toastr.success("Successfully reset NVM.");
            });
        }

        function enterDebugMode() {
            repository.data.debugMode = true;
        }
    }
})();