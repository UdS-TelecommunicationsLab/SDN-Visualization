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

(function(sdnViz) {
    "use strict";
    sdnViz.factory("websockets", function($rootScope, toastr) {
        var socket = io.connect("/");

        var bind = function(channel, callback) {
            socket.on(channel, callback);
        };

        bind("connect", function() {
            $rootScope.status.transport = true;
            $rootScope.$digest();
        });

        bind("disconnect", function() {
            $rootScope.status.transport = false;
            $rootScope.$digest();
        });

        bind("/error", function(message) {
            toastr.error(message);
        });

        return {
            bind: bind,
            publish: function(channel, data, onSuccess, onError) {
                socket.emit(channel, data, function(res) {
                    if (res.success) {
                        $rootScope.$apply(function() {
                            if (onSuccess)
                                onSuccess(res.data);
                        });
                    } else {
                        toastr.error("Concurrent access");
                        $rootScope.$apply(function() {
                            if (onError)
                                onError(res);
                        });
                    }
                });
            },
            subscribe: function(channel, callback) {
                socket.on(channel, function() {
                    var args = arguments;
                    $rootScope.$apply(function() {
                        callback.apply(null, args);
                    });
                });
            },
            subscribeModelUpdate: function(callback) {
                socket.on("/modelUpdate", function() {
                    var args = arguments;
                    var changes = args[0].diff;
                    args[0].changes = msgpack.unpack(changes);
                    $rootScope.$apply(function() {
                        callback.apply(null, args);
                    });
                });
            }
        };
    });
})(window.sdnViz);