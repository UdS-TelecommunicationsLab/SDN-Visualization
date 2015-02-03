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

(function(sdnViz) {
    "use strict";
    sdnViz.controller("DetailLinkCtrl", function(DetailView, $rootScope, $scope, $routeParams, repository, websockets) {
        DetailView.init($scope, $routeParams.id, repository.getLinkById);
        $scope.isEditable = !$rootScope.isStandalone;

        // LOSS
        $scope.editLoss = false;
        $scope.loss = 0;
        $scope.startEditLoss = function() {
            $scope.loss = $scope.item.plr * 1000;
            $scope.editLoss = true;
        };
        $scope.stopEditLoss = function() { $scope.editLoss = false; };

        $scope.modifyLoss = function(loss) {
            websockets.publish("/interact/setLinkSpec", {
                loss: loss,
                user: $scope.item.srcHost.userName,
                srcNode: $scope.item.srcHost.url,
                dstNode: $scope.item.dstHost.url,
                iface: $scope.item.srcPort
            });
            $scope.stopEditLoss();
        };

        // DELAY
        $scope.editDelay = false;
        $scope.delay = 0;
        $scope.startEditDelay = function() {
            $scope.delay = $scope.item.delay * 1000;
            $scope.editDelay = true;
        };
        $scope.stopEditDelay = function() { $scope.editDelay = false; };

        $scope.modifyDelay = function(delay) {
            websockets.publish("/interact/setLinkSpec", {
                delay: delay,
                user: $scope.item.srcHost.userName,
                srcNode: $scope.item.srcHost.url,
                dstNode: $scope.item.dstHost.url,
                iface: $scope.item.srcPort
            });
            $scope.stopEditDelay();
        };

        $scope.load();
    });
})(window.sdnViz);