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

(function (exports) {
    "use strict";

    exports.nodeTypes = {
        Anonymous: "Anonymous",
        AccessPoint: "AccessPoint",
        Camera: "Camera",
        Car: "Car",
        Cloud: "Cloud",
        Dashboard: "Dashboard",
        Database: "Database",
        Display: "Display",
        Earphone: "Earphone",
        Factory: "Factory",
        Flag: "Flag",
        Health: "Health",
        Home: "Home",
        Monitoring: "Monitoring",
        Node: "Node",
        Pad: "Pad",
        PC: "PC",
        Person: "Person",
        Phone: "Phone",
        Position: "Position",
        Power: "Power",
        Printer: "Printer",
        Road: "Road",
        Robot: "Robot",
        Server: "Server",
        Shield: "Shield",
        Ship: "Ship",
        Shipment: "Shipment",
        Shop: "Shop",
        Subway: "Subway",
        Train: "Train",
        University: "University",
        Finland: "Finland",
        Unknown: "Unknown"
    };

    // http://www.iana.org/assignments/protocol-numbers/protocol-numbers.xhtml
    exports.networkProtocols = {
        1: "ICMP",
        2: "IGMP",
        6: "TCP",
        17: "UDP"
    };

    exports.serviceNames = {
        6: {
            22: "SSH",
            23: "Telnet",
            80: "HTTP",
            443: "HTTPS",
        },
        17: {

        }
    };

})((typeof process === 'undefined' || !process.versions) ? window.sdn = window.sdn || {} : exports);