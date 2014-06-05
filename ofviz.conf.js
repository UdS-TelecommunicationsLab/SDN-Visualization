// Karma configuration
// Generated on Fri Oct 18 2013 15:56:24 GMT+0200 (W. Europe Daylight Time)
module.exports = function(config) {
  config.set({
    basePath: './',
    frameworks: ['jasmine'],
    files: [
      './public/shared/OFVM.js',
      './public/js/lib/objectDiff.js',
      'test/**/*.js'
    ],
    exclude: [
    ],
    reporters: ['progress'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    browsers: [],
    captureTimeout: 60000,
    singleRun: false
  });
};
