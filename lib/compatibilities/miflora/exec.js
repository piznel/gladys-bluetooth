const rp = require('request-promise');
const emojiStrip = require('emoji-strip');
const globalConfig = require('../../../config.js');
const config = require('./config.js');
const MiFlora = require('./MiFlora');

var lastMeasureDate = new Date('1970-01-01');
var mesureDelay = parseInt(config.updateInterval, 10) * 60 * 1000;

module.exports = function exec(peripheral) {
    var now = new Date();
    var isTimeElapsed = (now - lastMeasureDate) >= mesureDelay;

    if (!isTimeElapsed) {
        console.log('Time not yet elapsed !');
        return null;
    }

    var miFlora = new MiFlora(peripheral.address);

    miFlora.connectDevice(peripheral);

    var device = {
        name: config.name,
        identifier: peripheral.address,
        protocol: 'bluetooth',
        service: 'miflora'
    };

    miFlora.on('data', function (data) {
        //console.log(`data: ${JSON.stringify(data)}`);

        var types = [
            {
                type: 'temperature',
                name: 'temperature',
                identifier: 'temperature',
                units: '°C',
                sensor: true,
                min: -30,
                max: 50
            },
            {
                type: 'lux',
                name: 'lux',
                identifier: 'lux',
                units: 'Lux',
                sensor: true,
                min: 0,
                max: 100000
            },
            {
                type: 'moisture',
                name: 'moisture',
                identifier: 'moisture',
                units: '%',
                sensor: true,
                min: 0,
                max: 100
            },
            {
                type: 'fertility',
                name: 'fertility',
                identifier: 'fertility',
                units: 'uS/cm',
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

        return rp(options)
            .then((parsedResult) => {
                parsedResult.types.forEach(function(type) {
                    switch (type.type) {
                        case 'temperature':
                            setDevicestate(type.id, data.temperature, parsedResult)
                                .then((parsedResult) => {
                                    console.log(`Device "${parsedResult.device.name}" and DeviceState "${type.type}" inserted with success !`);
                                });
                            break;
                        case 'lux':
                            setDevicestate(type.id, data.lux, parsedResult)
                                .then((parsedResult) => {
                                    console.log(`Device "${parsedResult.device.name}" and DeviceState "${type.type}" inserted with success !`);
                                });
                            break;
                        case 'moisture':
                            setDevicestate(type.id, data.moisture, parsedResult)
                                .then((parsedResult) => {
                                    console.log(`Device "${parsedResult.device.name}" and DeviceState "${type.type}" inserted with success !`);
                                });
                            break;
                        case 'fertility':
                            setDevicestate(type.id, data.fertility, parsedResult)
                                .then((parsedResult) => {
                                    console.log(`Device "${parsedResult.device.name}" and DeviceState "${type.type}" inserted with success !`);
                                });
                            break;
                        default:
                            break;
                    }
                }, this);

                lastMeasureDate = new Date();

                return null;
            })
            .catch((err) => {
                console.log('Error while sending data to Gladys');
                console.log(err);
                console.log(err.statusCode);
            });
    });

    miFlora.on('firmware', function (data) {
        //console.log(`firmware: ${JSON.stringify(data)}`);

        var types = [
            {
                type: 'batteryLevel',
                name: 'batteryLevel',
                identifier: 'batteryLevel',
                units: '%',
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

        return rp(options)
            .then((parsedResult) => {
                parsedResult.types.forEach(function(type) {
                    switch (type.type) {
                        case 'batteryLevel':
                            setDevicestate(type.id, data.batteryLevel, parsedResult)
                                .then((parsedResult) => {
                                    console.log(`Device "${parsedResult.device.name}" and DeviceState "${type.type}" inserted with success !`);
                                });
                            break;
                        default:
                            break;
                    }
                }, this);

                lastMeasureDate = new Date();

                return null;
            })
            .catch((err) => {
                console.log('Error while sending data to Gladys');
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