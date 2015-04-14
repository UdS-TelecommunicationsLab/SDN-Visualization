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

(function (common) {
    "use strict";

    var config = require("../ui-config");

    common.evaluatePattern = function (pattern, input) {
        var patternLength = 23;

        if (pattern.length !== patternLength && input.length !== patternLength) {
            throw new Error("Pattern and input need to have " + patternLength + " characters");
        }

        var extractedId = "";
        for (var j = 0; j < patternLength; j++) {
            if (pattern.charAt(j) === '#') {
                extractedId += input.charAt(j);
            }
        }

        var regularExpression = "";
        var segments = pattern.split(/\?|\#/); // this will remove ? and #

        for (var segmentIndex = 0; segmentIndex < segments.length; segmentIndex++) {
            regularExpression += segments[segmentIndex];
            if (segmentIndex < segments.length - 1) {
                regularExpression += "[0-9|a-f]"; // valid hexadecimal digit as a replacement for ? or #
            }
        }

        return { isMatch: new RegExp(regularExpression).test(input), extractedId: extractedId };
    };

    common.getDeviceEntry = function (id) {
        var configuration = config.getConfiguration();

        for (var key in configuration.deviceInformation) {
            var test = common.evaluatePattern(configuration.deviceInformation[key].pattern, id);
            if (test.isMatch) {
                return { node: configuration.deviceInformation[key], extractedId: test.extractedId };
            }
        }

        return { node: undefined };
    };

    common.getName = function(device) {
        if (device.node) {
            if (device.extractedId) {
                return device.node.name.replace(/#/g, device.extractedId);
            } else {
                return device.node.name;
            }
        }
        return "";
    };

})(exports);