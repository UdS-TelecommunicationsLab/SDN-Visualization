(function(sdnViz, angular) {
    sdnViz.filter("jsonPretty", function() {
        return function(input) {
            return angular.toJson(input, true);
        };
    });
})(window.sdnViz, window.angular);