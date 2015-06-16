(function () {
    "use strict";

    angular
        .module("sdn-visualization")
        .directive("sdnRelayTable", sdnRelayTable);

    sdnRelayTable.$inject = [];

    function sdnRelayTable() {
        var directive = {
            restrict: "E",
            replace: true,
            templateUrl: "/templates/relaying/sdn-relay-table",
            scope: {
                protocol: "@"
            },
            controller: sdnRelayController,
            controllerAs: "vm",
            bindToController: true
        };
        return directive;
    }

    sdnRelayController.$inject = ["$scope", "repository", "websockets"];

    function sdnRelayController($scope, repository, websockets) {
        var vm = this;
        vm.data = repository.data;
        vm.relayingData = {};
        vm.updateRelay = updateRelay;
        vm.relayKey = relayKey;
        vm.updateRelay = updateRelay;
        vm.removeRelay = removeRelay;
        vm.toggleGlobalRelaying = toggleGlobalRelaying;

        activate();

        /////////////

        function relayKey(entry) {
            return entry.filterIP + entry.filterPort;
        }

        function updateRelay(relay) {
            var msg = {
                transport: vm.protocol,
                filterIP: relay.filterIP,
                filterPort: relay.filterPort,
                relayIP: relay.relayIP,
                relayMAC: relay.relayMAC,
                switchDPID: relay.switchDPID,
                switchPort: relay.switchPort,
                transportPort: relay.transportPort,
                enabled: !relay.enabled
            };

            websockets.publish("/relaying/update", msg, function () {
                toastr.success("Successfully updated the relay.");
            }, function () {
                toastr.error("Error updating the relay.");
            });
        }

        function removeRelay(ip, port) {
            bootbox.confirm("Are you sure you want to delete relay with filter " + ip + ":" + port + "?", function (result) {
                if (result) {
                    var msg = {transport: vm.protocol, filterIP: ip, filterPort: port};
                    websockets.publish("/relaying/remove", msg, function (data) {
                        toastr.success("Successfully removed the relay.");
                    }, function () {
                        toastr.error("Error removing the relay.");
                    });
                }
            });
        }

        function toggleGlobalRelaying() {
            var status = !vm.data.nvm.controller.relaying[vm.protocol].enabled;
            var msg = {
                transport: vm.protocol,
                status: status
            };
            websockets.publish("/relaying/toggle", msg, function (data) {
                toastr.success("Successfully toggled " + vm.protocol + " relaying.");
            }, function () {
                toastr.error("Error toggling " + vm.protocol + " relaying.");
            });
        }

        function activate() {
            $scope.$watch("vm.protocol", function () {
                vm.relayingData = vm.data.nvm.controller.relaying[vm.protocol];
            });
        }
    }
})();
