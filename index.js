'use strict';

var modbus = require("modbus-stream");
var Modbus_TCP_register = require("./CCGX-Modbus-TCP-register-list-3.00.json");
var debug = null;//"automaton-2454";

/**
 * 
 * Request Modbus TCP 
 * 
 * request: `{UnitID}?${RegisterAddress}=${setValue}`
 * example: requestModbusTCP("192.168.8.106", 502, "100?817+818+819", (err, result) => { ... })
 * see info: https://www.victronenergy.com/live/ccgx:modbustcp_faq
 * 
 * @param {string} host
 * @param {number} port example: 502
 * @param {string} request `{UnitID}?${RegisterAddress}=${setValue}`
 *  example: "100?817+818+819"
 * @param {(err:any, result:object)=>void} callback
 */
function requestModbusTCP(host, port, request, callback) {

    var [path, query] = request.split('?');
    var unitId = path.split('/').pop();
    var addresses = query.split('+');

    modbus.tcp.connect(port, host, { debug }, (err, connection) => {

        if (err) { callback(err.message); return; }

        addresses.forEach(function (str) {

            if (!str) { return; }
            var [address, value] = str.split('=');
            read_write(unitId, address, value);
        });

        function read_write(unitId, address, set_value) {

            if (!read_write.info) read_write.info = {};
            if (read_write.wait) read_write.wait++;
            else read_write.wait = 1;


            read_write_value(address);

            function read_write_value(address) {

                var dbus_service_name, description, address, type,
                    scalefactor, range, dbus_obj_path = "error",
                    writable, dbus_unit, remarks;

                if (!Modbus_TCP_register[address]) { _callback("This address is not supported."); return; }

                [
                    dbus_service_name, description, address, type,
                    scalefactor, range, dbus_obj_path,
                    writable, dbus_unit, remarks
                ] = Modbus_TCP_register[address];

                var quantity = 1;

                if (type.startsWith("string")) {
                    quantity = type.match(/\d+/g).join('');
                }


                if (set_value && writable.toLowerCase() === "yes") {

                    var arr_buf = calc_set_value(set_value);

                    if (typeof arr_buf === "string") { _callback(null, arr_buf); return; }

                    connection.writeMultipleRegisters({ address, extra: { unitId }, values: arr_buf }, function (err) {

                        if (err) { _callback(err.message); return; }
                        setTimeout(function () { read(); }, 1000);
                    });

                    return;
                }

                read();
                function read() {

                    connection.readHoldingRegisters({ address, quantity, extra: { unitId } }, function (err, res) {

                        if (err) _callback(err.message)
                        else if (type.startsWith("string")) _callback(null, read_string(res.response.data));
                        else _callback(null, calc_data(res.response.data[0]));
                    });
                }
                function calc_set_value(value) {

                    type = type.toLowerCase().trim();

                    if (type === "int16") { value = NumberToUint16(value) * scalefactor; }
                    else if (type === "int32") { value = NumberToUint16(value) * scalefactor; }
                    else if (type === "uint16") { value = NumberToUint16(value) * scalefactor; }
                    else if (type === "uint32") { value = NumberToUint16(value) * scalefactor; }
                    else if (type.startsWith("string")) {

                        var bytes = StringToBytes(value);
                        var arr = [];

                        while (bytes.length) {

                            var a = bytes.shift();
                            var b = bytes.shift() || 0;
                            arr.push(Buffer.from([a, b]));
                        }

                        return arr;
                    }
                    else { value = "Invalid data type."; }

                    var buf = Buffer.alloc(2);
                    buf.writeUInt16BE(value);
                    return [buf];
                }
                function calc_data(buf) {

                    var val = byteArrayToUint(buf);

                    type = type.toLowerCase().trim();

                    if (type === "int16") { val = NumberToInt16(val) / scalefactor; }
                    else if (type === "int32") { val = NumberToInt32(val) / scalefactor; }
                    else if (type === "uint16") { val = val / scalefactor; }
                    else if (type === "uint32") { val = val / scalefactor; }
                    else if (type.startsWith("string")) { val = buf.toString(); }
                    else { val = "Invalid data type."; }

                    if (typeof dbus_unit === "string" && dbus_unit.includes('=')) {

                        var arrUnitStr = dbus_unit.split(';').reduce(function (obj, v) {

                            v = v.split('=').map(function (v) { return v.trim(); });
                            obj[v[0]] = v[1];
                            return obj;

                        }, {});

                        return {
                            val, val_name: arrUnitStr[val], dbus_unit, description, remarks,
                            dbus_service_name, dbus_obj_path, address,
                            type, range, scalefactor, writable
                        };
                    }

                    return {
                        val, dbus_unit, description, remarks,
                        dbus_service_name, dbus_obj_path, address,
                        type, range, scalefactor, writable
                    };
                }
                function read_string(arr_buf) {

                    return arr_buf.reduce(function (str, buf) {

                        return buf.reduce(function (s, b) {

                            if (31 < b && b < 127) s += String.fromCharCode(b);
                            return s;

                        }, str);
                    }, "");
                }
                function _callback(err, value) {

                    if (err) {

                        callback(err);
                        return;
                    }

                    var obj = read_write.info;
                    var names = dbus_obj_path.split('/').filter(function (v) { return v.length; });
                    var name = names.pop();

                    while (names.length) {

                        var n = names.shift();

                        if (!obj[n]) { obj[n] = {}; }
                        obj = obj[n];
                    }

                    obj[name] = value;

                    read_write.wait--;

                    if (read_write.wait < 1) {

                        connection.close();
                        callback(null, read_write.info);
                    }
                }
            }
        }
    });
}
module.exports = requestModbusTCP;


/*** helpers ***/
function NumberToUint8(x) {

    return NumberToUint32(x) & 0xFF;
}
function NumberToInt8(x) {

    var r = 0;
    let n = NumberToUint8(x);

    if (n & 0x80)
        r = 0xFFFFFF80 | (n & 0x7F);

    else
        r = n;

    return (r);
}
function NumberToInt32(x) {

    return x >> 0;
}
function NumberToUint32(x) {

    return x >>> 0;
}
function NumberToUint16(x) {

    return NumberToUint32(x) & 0xFFFF;
}
function NumberToInt16(x) {

    var r = 0;
    var n = NumberToUint16(x);

    if (n & 0x8000)
        r = 0xFFFF8000 | (n & 0x7FFF);

    else
        r = n;

    return (r);
}
function isTrue(val) {

    return String(val).toLowerCase() === 'true'
}
function byteArrayToUint(byteArray) {

    var value = 0;

    for (var i = 0; i < byteArray.length; i++) {

        value = (value * 256) + byteArray[i];
    }

    return value;
};
function StringToBytes(str) {

    var bytes = [];

    for (var i = 0; i < str.length; ++i) {

        bytes.push(NumberToUint8(str.charCodeAt(i)));
    }
    return bytes;
};