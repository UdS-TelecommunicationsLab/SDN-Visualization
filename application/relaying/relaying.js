(function (relaying, DEBUG) {
    "use strict";

    var config = require("../ui-config"),
        request = require("request"),
        _ = require("lodash");

    relaying.registerSockets = registerSocket;

    /////////////
    function registerSocket(socket) {
        socket.on("/relaying/toggle", handleToggleRelayReq);
        socket.on("/relaying/create", handleCreateRelayReq);
        socket.on("/relaying/update", handleCreateRelayReq);
        socket.on("/relaying/remove", handleRemoveRelayReq);
    }

    // create (or update!) a relay
    function handleCreateRelayReq(message, callback) {
        // server configuration
        var configuration = config.getConfiguration();
        var connectionString = configuration.dataSource && configuration.dataSource.connectionString;

        // url to query http://(ip|domain[:port])/wm/uds/relaying/{transport}/{filterip}/{filterport}/json
        var url = "http://" + connectionString + "/wm/uds/relaying/" + message.transport + "/" + message.filterIP + "/" + message.filterPort + "/json";

        // data to submit
        var data = {
            ip: message.relayIP,
            port: message.transportPort.toString(),
            relayMac: message.relayMAC,
            switchDpid: message.switchDPID,
            switchPort: message.switchPort,
            enabled: message.enabled ? "true" : "false"
        };
        // performing the query
        request({method: 'POST', body: data, json: true, url: url}, function (error, response, rdata) {
            if (DEBUG) {
                console.log(response);
            }
            var isSuccess = (!error && _.includes([200, 201, 202], response.statusCode));
            callback({success: isSuccess });
        });
    }

    // remove a filter/ relay
    function handleRemoveRelayReq(message, callback) {
        var configuration = config.getConfiguration();
        var connectionString = configuration.dataSource && configuration.dataSource.connectionString;
        if (DEBUG) {
            console.log(JSON.stringify(message));
        }
        // url to query
        var url = "http://" + connectionString + "/wm/uds/relaying/" + message.transport + "/" + message.filterIP + "/" + message.filterPort + "/json";
        if (DEBUG) {
            console.log(url);
        }
        // performing the query
        request({method: 'DELETE', url: url}, function (error, response, data) {
            callback({success: (!error && response.statusCode == 202), data: data});
        });
    }

    // enable/ disable global relaying
    function handleToggleRelayReq(message, callback) {
        var configuration = config.getConfiguration();
        var connectionString = configuration.dataSource && configuration.dataSource.connectionString;

        var url = "http://" + connectionString + "/wm/uds/relaying/" + message.transport + "/json";
        var data = {enabled: message.status ? "true" : "false"};
        request({method: 'POST', body: data, json: true, url: url}, function (error, response, rdata) {
            var isSuccess = (!error && _.includes([200, 202], response.statusCode));
            callback({success: isSuccess, data: isSuccess});
        });
    }
})(exports, false);
