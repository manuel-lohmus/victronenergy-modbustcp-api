'use strict';

//var requestModbusTCP = require("victronenergy-modbustcp-api");
var requestModbusTCP = require("../../index.js");
var server = require("tiny-https-server");
var options = require("config-sets");
options.init({
    modbusPort: 502,
    modbusHostname: "192.168.8.106"
});

server.on("request", function (req, res, next) {

    if (req.url.startsWith("/$modbus/")) {

        requestModbusTCP(
            options.modbusHostname,
            options.modbusPort,
            req.url.substring(9),
            function (err, result) {

                res.writeHead(200, { "Content-Type": "text/json" });
                res.write(JSON.stringify(err || result));
                res.end();
            }
        );
    }
    else
        next();
});


var port = options.tiny_https_server.port;
if (port === 80 || port === 443) { port = ""; }
else { port = ":" + port; }

// Opens the URLs in the browser.
require("browse-url")(`http://localhost${port}/`);