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

(function(sdnViz) {
    "use strict";
    sdnViz.controller("StatisticsCtrl", function($scope, repository) {
        $scope.isClientVisible = true;
        $scope.isNodeVisible = true;

        $scope.data = repository.data;

        $scope.lossClass = function(value) {
            if(value !== null) {
                if(value > 0.1) {
                    return ["label-danger"];
                } else if (value > 0.01) {
                    return ["label-warning"];
                } else {
                    return ["label-default"];
                }
            }
            return ["hidden"];
        };

        $scope.rateClass = function(value) {
            if(value !== null) {
                if(value > 4000) {
                    return ["label-danger"];
                } else if (value > 1000) {
                    return ["label-warning"];
                }
                return ["label-success"];
            }
            return ["hidden"];
        };

        $scope.delayClass = function(value) {
            if(value !== null) {
                if(value > 75) {
                    return ["label-danger"];
                } else if (value > 10) {
                    return ["label-warning"];
                }
                return ["label-default"];
            }
            return ["hidden"];
        };

    });
})(window.sdnViz);