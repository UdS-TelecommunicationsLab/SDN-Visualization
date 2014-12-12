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

(function(exports) {
    "use strict";
    exports.num2mac = function(decimalMac) {
        if (!decimalMac) {
            return "00:00:00:00:00:00";
        }

        var textualRepresentation = decimalMac.toString(16);
        while (textualRepresentation.length < 12) {
            textualRepresentation = '0' + textualRepresentation;
        }
        var concat = new Array(6).join('00') // '000000000000'
            .match(/../g) // [ '00', '00', '00', '00', '00', '00' ]
            .concat(
                textualRepresentation // "4a8926c44578"
                .match(/.{1,2}/g) // ["4a", "89", "26", "c4", "45", "78"]
            );
        return concat // ["00", "00", "00", "00", "00", "00", "4a", "89", "26", "c4", "45", "78"]
            .reverse() // ["78", "45", "c4", "26", "89", "4a", "00", "00", "00", "00", "00", "00"]
            .slice(0, 6) // ["78", "45", "c4", "26", "89", "4a" ]
            .reverse() // ["4a", "89", "26", "c4", "45", "78"]
            .join(':'); // "4a:89:26:c4:45:78"
    };

    exports.dot2num = function(dot) {
        var d = dot.split('.');
        return ((((((+d[0]) * 256) + (+d[1])) * 256) + (+d[2])) * 256) + (+d[3]);
    };

    exports.num2dot = function(num) {
        var d = num % 256;
        for (var i = 0; i < 3; i++) {
            num = Math.floor(num / 256);
            d = num % 256 + '.' + d;
        }
        return d;
    };

    exports.ethernetFrameType = function(type) {
        if (type <= 1500) {
            return "Ethernet II";
        }
        switch (type) {
        case 2048:
            return "IP";
        case 33079:
        case 33080:
            return "Novell IPX";
        default:
            return "unknown";
        }
    };

    exports.getMaskedNetworkAddress = function(ip, mask) {
        var bits;
        var mbits = new Array(4);
        var sizeByte = 8;

        for (var i = 0; i < mbits.length; i++) {
            if (mask >= sizeByte) {
                bits = new Array(sizeByte + 1).join(1 + '');
                mask -= sizeByte;
            } else {
                bits = new Array(mask + 1).join(1 + '');
                bits += new Array(sizeByte + 1 - mask).join(0 + '');
                mask -= mask;
            }
            mbits[i] = parseInt(bits, 2);
        }
        var ibits = ip.split(".");
        var maskedip = '';
        for (i = 0; i < mbits.length; i++) {
            if (maskedip !== '') {
                maskedip += '.';
            }
            ibits[i] = parseInt(ibits[i], 10);
            ibits[i] &= mbits[i];
            maskedip += ibits[i] + '';
        }

        return maskedip;
    };

    exports.numberToIp = function(input, wildcard) {
        var ip = exports.num2dot(input);
        var mask = 32;
        if (wildcard) {
            exports.num2dot(wildcard).split(".").forEach(function(i) {
                var n = Math.log((parseInt(i, 10)) + 1) / Math.log(2);
                mask += n;
            });
        }
        return exports.getMaskedNetworkAddress(ip, mask);
    };

})((typeof process === 'undefined' || !process.versions) ? window.sdn = window.sdn || {} : exports);