module.exports = function () {
    var root = "./";

    var config = {
        packages: [
            "./package.json",
            "./bower.json"
        ],
        root: root
    };
    return config;
};
