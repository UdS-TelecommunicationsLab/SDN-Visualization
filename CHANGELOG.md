<a name="2015.8.0"></a>
# 2015.8.0

## Features

- Analytics feature introduced. Using the `sdnalytics` library (also available on GitHub), the network can be analyzed and results are displayed in the visualization.
- Relaying Feature introduced. The visualization can now be used to inform the Floodlight controller of existing relays inside the network. Check out https://www.on.uni-saarland.de/start for more information.
- Controller Logs are now displayed on the Status page to give information on events that happen inside the controller software.
- Delay Measurement now gives more information by measuring derivation and using an exponentially weighted moving average.  
- Device thumbnails can now be initialized by a deviceId.
- ARP opcodes are properly displayed.
- Worker's poll interval is now configurable.
- Sessions are now persisted as files and are not dropped by restarting the server.

## Improvements

- README contains frequently asked questions.
- Update third party libraries (lodash, AngularJS).
- Replace Grunt task runner with Gulp.
- NOX support is dropped to unify interfaces.
- Link manipulation code removed.
- Demo mode restrictions are now also enforced on the server side.
- Used JSHint and removed several problems.
- Several bug fixes.
- Start applying an Angular Style guide to the code.

<a name="2015.4.0"></a>
# 2015.4.0

First version with new schema and CHANGELOG.