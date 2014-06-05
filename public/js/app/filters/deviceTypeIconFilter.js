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
 * This license applies to all parts of the OpenFlow Visualization Application that are not externally
 * maintained libraries. The licenses of externally maintained libraries can be found in /licenses.
 */

(function(ofvizApp) {
    "use strict";
    ofvizApp.filter("deviceTypeIcon", function() {
        return function(device) {
            switch (device) {
            case ofviz.nodeTypes.AccessPoint:
                return "\uf012"; // fa-signal
            case ofviz.nodeTypes.Camera:
                return "\uf030"; // fa-camera
            case ofviz.nodeTypes.Car:
                return "\uf1b9"; // fa-automobile
            case ofviz.nodeTypes.Cloud:
                return "\uf0c2"; // fa-cloud
            case ofviz.nodeTypes.Display:
                return "\uf108"; // fa-desktop
            case ofviz.nodeTypes.Earphone:
                return "\uf095"; // fa-phone
            case ofviz.nodeTypes.Factory:
                return "\uf1ad"; // fa-building
            case ofviz.nodeTypes.Finland:
                return "\uf067"; // fa-plus
            case ofviz.nodeTypes.Flag:
                return "\uf024"; // fa-flag
            case ofviz.nodeTypes.Health:
                return "\uf0fe"; // fa-plus-square 
            case ofviz.nodeTypes.Home:
                return "\uf015"; // fa-home
            case ofviz.nodeTypes.Node:
                return "\uf1e0"; // fa-share-alt
            case ofviz.nodeTypes.Pad:
                return "\uf10a"; // fa-tablet
            case ofviz.nodeTypes.PC:
                return "\uf109"; // fa-laptop
            case ofviz.nodeTypes.Phone:
                return "\uf10b"; // fa-mobile
            case ofviz.nodeTypes.Position:
                return "\uf041"; // fa-map-marker
            case ofviz.nodeTypes.Power:
                return "\uf0e7"; // fa-bolt
            case ofviz.nodeTypes.Printer:
                return "\uf02f"; // fa-print
            case ofviz.nodeTypes.Road:
                return "\uf018"; // fa-road
            case ofviz.nodeTypes.Server:
                return "\uf1c0"; // fa-database
            case ofviz.nodeTypes.Shield:
                return "\uf132"; // fa-shield
            case ofviz.nodeTypes.Shipment:
                return "\uf0d1"; // fa-truck
            case ofviz.nodeTypes.Shop:
                return "\uf07a"; // fa-shop
            case ofviz.nodeTypes.Unknown:
                return "\uf059"; // fa-question-circle
            }
            return "\uf059"; // fa-question-circle
        };
    });
})(window.ofvizApp);