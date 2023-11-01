'use strict';
setTimeout(() => { }, 60000);

var util = require('util');
//var requestModbusTCP = require("victronenergy-modbustcp-api");
var requestModbusTCP = require("../../index.js");
var modbusPort = 502;
var modbusHostname = "192.168.8.106";
var requests = [

    // /Ac/Consumption/L1+L2+L3/Power
    `/$modbus/100?817+818+819`,

    //// /Ac/Grid/L1+L2+L3/Power
    //`$modbus/100?820+821+822`,

    //// /Dc/Battery/Power
    //`/$modbus/100?842`,

    //// /Dc/Battery/Temperature
    //`/$modbus/228?61`,

    //// /Dc/Battery/Soc
    //`/$modbus/100?843`,

    //// /Hub4/Sustain
    //`/$modbus/228?73`,

    //// //Serial
    //`/$modbus/100?800`,

    //// //Serial
    //`/$modbus/30?2609`,

    //// /Settings/Cgwacs/AcPowerSetPoint
    //`/$modbus/100?2700`,

    //// /Settings/Cgwacs/MaxChargePercentage
    //`/$modbus/100?2701`,

    //// /Settings/Cgwacs/MaxDischargePercentage
    //`/$modbus/100?2702`,

    //// /Settings/Cgwacs/AcPowerSetPoint
    //`/$modbus/100?2703`,

    //// /Settings/Cgwacs/Hub4Mode
    //`/$modbus/100?2902`,

    //// /State
    //`/$modbus/228?31`,

    //// /Switch Position
    //`/$modbus/228?33=4`,

    //// /Ac/L1|L2|L3/Energy/Forward|Reverse
    //`/$modbus/30?2603+2604+2605+2606+2607+2608`,

    //// /Ac/L1|L2|L3/Voltage|Current
    //`/$modbus/30?2616+2617+2618+2619+2620+2621`,

    //// /gps
    //`/$modbus/100?2800+2802+2804+2805+2806+2807+2808`,
];

requests.forEach(function (request) {

    requestModbusTCP(
        modbusHostname,
        modbusPort,
        request.substring(9),
        function (err, result) {

            if (err) { console.error(err); }
            console.log(util.inspect(result, { showHidden: false, depth: null, colors: true }));
        }
    );
});