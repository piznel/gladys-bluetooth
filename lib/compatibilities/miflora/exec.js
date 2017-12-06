const rp = require('request-promise');
const emojiStrip = require('emoji-strip');
const globalConfig = require('../../../config.js');
const config = require('./config.js');
const MiFlora = require('./MiFlora');

var lastMeasureDateTemperature = new Map();
var mesureDelayTemperature = parseInt(config.updateIntervalTemperature, 10) * 60 * 1000;
var lastMeasureDateLux = new Map();
var mesureDelayLux = parseInt(config.updateIntervalLux, 10) * 60 * 1000;
var lastMeasureDateMoisture = new Map();
var mesureDelayMoisture = parseInt(config.updateIntervalMoisture, 10) * 60 * 1000;
var lastMeasureDateFertility = new Map();
var mesureDelayFertility = parseInt(config.updateIntervalFertility, 10) * 60 * 1000;
var lastMeasureDateBatteryLevel = new Map();
var mesureDelayBatteryLevel = parseInt(config.updateIntervalBatteryLevel, 10) * 60 * 1000;

module.exports = function exec(peripheral) {
    var id = peripheral.id;
    //console.log(`miflora - last temperature data update: ${lastMeasureDateTemperature.get(id)}`);
    //console.log(`miflora - last lux data update: ${lastMeasureDateLux.get(id)}`);
    //console.log(`miflora - last moisture data update: ${lastMeasureDateMoisture.get(id)}`);
    //console.log(`miflora - last fertility data update: ${lastMeasureDateFertility.get(id)}`);
    //console.log(`miflora - last batteryLevel data update: ${lastMeasureDateBatteryLevel.get(id)}`);
    var dataReceived = false;
    var firmwareReceived = false;
    var now = new Date();
    var miFlora = new MiFlora(peripheral.address);

    miFlora.connectDevice(peripheral);
    //console.log(`miflora - connectDevice`);

    var device = {
        name: 'Flower care',
        identifier: peripheral.address,
        protocol: 'bluetooth',
        service: 'miflora'
    };

    miFlora.on('data', function (data) {
        //console.log(`miflora - data received`);
        var types = [
            {
                type: 'temperature',
                name: 'Temperature',
                identifier: 'temperature',
                unit: '°C',
                sensor: true,
                min: -30,
                max: 50
            },
            {
                type: 'lux',
                name: 'Lux',
                identifier: 'lux',
                unit: 'lux',
                sensor: true,
                min: 0,
                max: 100000
            },
            {
                type: 'moisture',
                name: 'Moisture',
                identifier: 'moisture',
                unit: '%',
                sensor: true,
                min: 0,
                max: 100
            },
            {
                type: 'fertility',
                name: 'Fertility',
                identifier: 'fertility',
                unit: 'µS/cm',
                sensor: true,
                min: 0,
                max: 1000
            }
        ];

        var options = {
            method: 'POST',
            uri: `${globalConfig.gladysUrl}/device?token=${globalConfig.token}`,
            body: {device, types},
            json: true
        };

        rp(options)
            .then((parsedResult) => {
                parsedResult.types.forEach(function(type) {
                    switch (type.type) {
                        case 'temperature':
                            if (!lastMeasureDateTemperature.get(id) || (now - lastMeasureDateTemperature.get(id)) >= mesureDelayTemperature) {
                                setDevicestate(type.id, data.temperature, parsedResult)
                                    .then((parsedResult) => {
                                        console.log(`Device "${parsedResult.device.name}" and DeviceState "${type.type}" inserted with success !`);
                                        lastMeasureDateTemperature.set(id, now);
                                    });
                            }
                            break;
                        case 'lux':
                            if (!lastMeasureDateLux.get(id) || (now - lastMeasureDateLux.get(id)) >= mesureDelayLux) {
                                setDevicestate(type.id, data.lux, parsedResult)
                                    .then((parsedResult) => {
                                        console.log(`Device "${parsedResult.device.name}" and DeviceState "${type.type}" inserted with success !`);
                                        lastMeasureDateLux.set(id, now);
                                    });
                            }
                            break;
                        case 'moisture':
                            if (!lastMeasureDateMoisture.get(id) || (now - lastMeasureDateMoisture.get(id)) >= mesureDelayMoisture) {
                                setDevicestate(type.id, data.moisture, parsedResult)
                                    .then((parsedResult) => {
                                        console.log(`Device "${parsedResult.device.name}" and DeviceState "${type.type}" inserted with success !`);
                                        lastMeasureDateMoisture.set(id, now);
                                    });
                            }
                            break;
                        case 'fertility':
                            if (!lastMeasureDateFertility.get(id) || (now - lastMeasureDateFertility.get(id)) >= mesureDelayFertility) {
                                setDevicestate(type.id, data.fertility, parsedResult)
                                    .then((parsedResult) => {
                                        console.log(`Device "${parsedResult.device.name}" and DeviceState "${type.type}" inserted with success !`);
                                        lastMeasureDateFertility.set(id, now);
                                    });
                            }
                            break;
                        default:
                            break;
                    }
                }, this);

                dataReceived = true;
                // When both response are received
                if (dataReceived && firmwareReceived) {
                    dataReceived = false;
                    firmwareReceived = false;

                    miFlora.disconnectDevice(peripheral);
                    //console.log(`miflora - disconnectDevice`);
                }
            })
            .catch((err) => {
                console.log('miflora - Error while sending data to Gladys');
                console.log(err);
                console.log(err.statusCode);
            });
    });

    miFlora.on('firmware', function (data) {
        //console.log(`miflora - firmware received`);
        var types = [
            {
                type: 'batteryLevel',
                name: 'Battery Level',
                identifier: 'batteryLevel',
                unit: '%',
                sensor: true,
                min: 0,
                max: 100
            }
        ];

        var options = {
            method: 'POST',
            uri: `${globalConfig.gladysUrl}/device?token=${globalConfig.token}`,
            body: {device, types},
            json: true
        };

        rp(options)
            .then((parsedResult) => {
                parsedResult.types.forEach(function(type) {
                    switch (type.type) {
                        case 'batteryLevel':
                            if (!lastMeasureDateBatteryLevel.get(id) || (now - lastMeasureDateBatteryLevel.get(id)) >= mesureDelayBatteryLevel) {
                                setDevicestate(type.id, data.batteryLevel, parsedResult)
                                    .then((parsedResult) => {
                                        console.log(`Device "${parsedResult.device.name}" and DeviceState "${type.type}" inserted with success !`);
                                        lastMeasureDateBatteryLevel.set(id, now);
                                    });
                            }
                            break;
                        default:
                            break;
                    }
                }, this);

                firmwareReceived = true;
                // When both response are received
                if (dataReceived && firmwareReceived) {
                    firmwareReceived = false;
                    dataReceived = false;

                    miFlora.disconnectDevice(peripheral);
                    //console.log(`miflora - disconnectDevice`);
                }
            })
            .catch((err) => {
                console.log('miflora - Error while sending data to Gladys');
                console.log(err);
                console.log(err.statusCode);
            });
    });

    function setDevicestate(id, value, parsedResult) {
        var options = {
            method: 'POST',
            uri: `${globalConfig.gladysUrl}/devicestate?token=${globalConfig.token}`,
            body: {devicetype: id, value: value},
            json: true
        };

        return rp(options).then(() => parsedResult);
    };
};