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

/**
 * `http://localhost/$modbus/${UnitID}?${Address}=${setValue}`
 * example http://localhost/$modbus/228?33=4
 * see info: https://www.victronenergy.com/live/ccgx:modbustcp_faq
 */
var urls = [

    // /Ac/Consumption/L1+L2+L3/Power
    `http://localhost${port}/$modbus/100?817+818+819`,

    //// /Ac/Grid/L1+L2+L3/Power
    //`http://localhost${port}/$modbus/100?820+821+822`,

    //// /Dc/Battery/Power
    //`http://localhost${port}/$modbus/100?842`,

    //// /Dc/Battery/Temperature
    //`http://localhost${port}/$modbus/228?61`,

    //// /Dc/Battery/Soc
    //`http://localhost${port}/$modbus/100?843`,

    //// /Hub4/Sustain
    //`http://localhost${port}/$modbus/228?73`,

    //// //Serial
    //`http://localhost${port}/$modbus/100?800`,

    //// //Serial
    //`http://localhost${port}/$modbus/30?2609`,

    //// /Settings/Cgwacs/AcPowerSetPoint
    //`http://localhost${port}/$modbus/100?2700`,

    //// /Settings/Cgwacs/MaxChargePercentage
    //`http://localhost${port}/$modbus/100?2701`,

    //// /Settings/Cgwacs/MaxDischargePercentage
    //`http://localhost${port}/$modbus/100?2702`,

    //// /Settings/Cgwacs/AcPowerSetPoint
    //`http://localhost${port}/$modbus/100?2703`,

    //// /Settings/Cgwacs/Hub4Mode
    //`http://localhost${port}/$modbus/100?2902`,

    //// /State
    //`http://localhost${port}/$modbus/228?31`,

    //// /Switch Position
    //`http://localhost${port}/$modbus/228?33=4`,

    //// /Ac/L1|L2|L3/Energy/Forward|Reverse
    //`http://localhost${port}/$modbus/30?2603+2604+2605+2606+2607+2608`,

    //// /Ac/L1|L2|L3/Voltage|Current
    //`http://localhost${port}/$modbus/30?2616+2617+2618+2619+2620+2621`,

    //// /gps
    //`http://localhost${port}/$modbus/100?2800+2802+2804+2805+2806+2807+2808`,
];

// Opens the URLs in the browser.
while (urls.length) {
    require("browse-url")(urls.shift());
}