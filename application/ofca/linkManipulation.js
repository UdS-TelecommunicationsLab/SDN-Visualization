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
 * maintained libraries. The licenses of externally maintained libraries can be found in /node_modules and /lib.
 */

(function (exports) {
    "use strict";

    var cp = require("child_process");

    exports.manipulateLink = function (node, user, iface, delay, loss, errback) {
        var sshCmd = "ssh " + user + "@" + node + " -oStrictHostKeyChecking=no";

        var cmdCheckTcInstallation = sshCmd + " command -v tc";
        var cmdCheckExistingRule = sshCmd + " sudo tc qdisc | grep -E \"" + iface + ".*(delay|loss)\" -c";

        var handleSetParameters = function (error, stdout, stderr) { // jshint ignore:line
            if (error !== null) {
                console.log("SET PARAM:");
                console.log(error);
                errback(error);
            }
        };

        var handleCheckExistingRule = function (error, stdout, stderr) { // jshint ignore:line
            if (parseInt(stdout, 10) !== 0 && error !== null) {
                // changing failed
                console.log("CHECK EXISTING:");
                console.log(error);
                errback(error);
                return;
            }
            var command = "add";
            if (stdout > 0) { // already configured
                command = "change";
            }
            var cmdSetParameters = sshCmd + " sudo tc qdisc " + command + " dev " + iface + " parent 1:fffe handle 101: netem delay " + delay + "ms loss " + loss + "%";
            cp.exec(cmdSetParameters, handleSetParameters);
        };

        var handleCheckTcInstallation = function (error, stdout, stderr) {  // jshint ignore:line
            if (error !== null) {
                errback(error);
                return;
            } else {
                // command exists
                cp.exec(cmdCheckExistingRule, handleCheckExistingRule);
            }
        };

        cp.exec(cmdCheckTcInstallation, handleCheckTcInstallation);
    };
})(exports);