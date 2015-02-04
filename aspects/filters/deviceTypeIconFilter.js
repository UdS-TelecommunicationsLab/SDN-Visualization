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
    sdnViz.filter("deviceTypeIcon", function() {
        return function(device) {
            switch (device) {
            case sdn.nodeTypes.Anonymous:
                return "\uf21b"; // fa-user-secret
            case sdn.nodeTypes.AccessPoint:
                return "\uf012"; // fa-signal
            case sdn.nodeTypes.Camera:
                return "\uf030"; // fa-camera
            case sdn.nodeTypes.Car:
                return "\uf1b9"; // fa-automobile
            case sdn.nodeTypes.Cloud:
                return "\uf0c2"; // fa-cloud
            case sdn.nodeTypes.Dashboard:
                return "\uf0e4"; // fa-tachometer
            case sdn.nodeTypes.Database:
                return "\uf1c0"; // fa-database
            case sdn.nodeTypes.Display:
                return "\uf108"; // fa-desktop
            case sdn.nodeTypes.Earphone:
                return "\uf095"; // fa-phone
            case sdn.nodeTypes.Factory:
                return "\uf1ad"; // fa-building
            case sdn.nodeTypes.Finland:
                return "\uf067"; // fa-plus
            case sdn.nodeTypes.Flag:
                return "\uf024"; // fa-flag
            case sdn.nodeTypes.Health:
                return "\uf0fe"; // fa-plus-square 
            case sdn.nodeTypes.Home:
                return "\uf015"; // fa-home
            case sdn.nodeTypes.Monitoring:
                return "\uf21e"; // fa-heartbeat
            case sdn.nodeTypes.Node:
                return "\uf1e0"; // fa-share-alt
            case sdn.nodeTypes.Pad:
                return "\uf10a"; // fa-tablet
            case sdn.nodeTypes.PC:
                return "\uf109"; // fa-laptop
            case sdn.nodeTypes.Person:
                return "\uf183"; // fa-male
            case sdn.nodeTypes.Phone:
                return "\uf10b"; // fa-mobile
            case sdn.nodeTypes.Position:
                return "\uf041"; // fa-map-marker
            case sdn.nodeTypes.Power:
                return "\uf0e7"; // fa-bolt
            case sdn.nodeTypes.Printer:
                return "\uf02f"; // fa-print
            case sdn.nodeTypes.Road:
                return "\uf018"; // fa-road
            case sdn.nodeTypes.Robot:
                return "\uf17b"; // fa-android
            case sdn.nodeTypes.Server:
                return "\uf233"; // fa-server
            case sdn.nodeTypes.Shield:
                return "\uf132"; // fa-shield
            case sdn.nodeTypes.Ship:
                return "\uf21a"; // fa-ship
            case sdn.nodeTypes.Shipment:
                return "\uf0d1"; // fa-truck
            case sdn.nodeTypes.Shop:
                return "\uf07a"; // fa-shop
            case sdn.nodeTypes.Subway:
                return "\uf239"; // fa-subway
            case sdn.nodeTypes.Train:
                return "\uf238"; // fa-train
            case sdn.nodeTypes.University:
                return "\uf19d"; // fa-graduation-cap
            case sdn.nodeTypes.Unknown:
                return "\uf059"; // fa-question-circle
            }
            return "\uf059"; // fa-question-circle
        };
    });
})(window.sdnViz);