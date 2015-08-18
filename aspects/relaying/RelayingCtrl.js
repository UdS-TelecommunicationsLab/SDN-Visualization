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
        .controller("RelayingCtrl", RelayingCtrl);

    RelayingCtrl.$inject = ["repository", "websockets"];

    function RelayingCtrl(repository, websockets) {
        var vm = this;
        vm.createRelay = createRelay;
        vm.data = repository.data;
        vm.relaying = getFormDefaults();
        vm.ipAddressPattern = "((1\\d{2}|2(5[0-5]|[0-4]\\d)|[1-9]\\d?)\.)((0|1\\d{2}|2(5[0-5]|[0-4]\\d)|[1-9]\\d?)\.){2}(1\\d{2}|2(5[0-5]|[0-4]\\d)|[1-9]\\d?)";
        vm.dpidPattern = "(([0-9a-fA-F]{2}):){7}[0-9a-fA-F]{2}";
        vm.macPattern = "([0-9a-fA-F]{2}:){5}([0-9a-fA-F]{2})";

        /////////////
        function getFormDefaults() {
            return {
                transport: "",
                filterIP: "",
                filterPort: "",
                switchDPID: "",
                switchPort: "",
                relayIP: "",
                relayMAC: "",
                transportPort: "",
                enabled: true
            };
        }

        function createRelay() {
            websockets.publish("/relaying/update", vm.relaying, function () {
                toastr.success("Successfully created the relay.");
                vm.relaying = getFormDefaults();
            }, function () {
                toastr.error("Error creating the relay.");
            });
        }
    }
})();