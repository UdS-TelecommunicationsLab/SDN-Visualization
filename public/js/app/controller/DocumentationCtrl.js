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
    ofvizApp.controller("DocumentationCtrl", function(messenger) {
        var updateAffixState = function() {
            var affix = $("#of-docs .affix");
            if ($("body").width() > 992) {
                affix.css("position", "fixed").css("width", $("#of-docs-side").width());
            } else {
                affix.css("position", "static").css("width", "100%");
            }
        };

        var buildNavigation = function() {
            var headings = {};

            // Generate First-Order Heading
            $("#of-docs-content h1").each(function(idx, element) {
                var localElement = $("<li><a href='/documentation/#" + element.id + "'>" + element.innerHTML + "</a><ul class='nav'></ul></li>");
                $("#of-docs-nav").append(localElement);
                headings[element.id] = localElement;
            });

            // Generate Second-Order Headings and associate with their parents
            $("#of-docs-content h2").each(function(idx, element) {
                var prev = $(element).prevAll("h1");
                var localElement = "<li><a href='/documentation/#" + element.id + "'>" + element.innerHTML + "</a></li>";
                $(headings[prev[0].id]).children("ul").append(localElement);
            });
        };

        var registerEvents = function() {
            $(window).on("resize", updateAffixState);
            messenger.publish.viewActive({ leaveCallback: function() { $(window).off("resize", updateAffixState); } });
        };

        var init = function() {
            buildNavigation();
            registerEvents();
            updateAffixState();
        };

        init();
    });
})(window.ofvizApp);