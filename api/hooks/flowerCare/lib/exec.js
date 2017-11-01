const MiFlora = require('./MiFlora');
const rp = require('request-promise');
const emojiStrip = require('emoji-strip');
const moment = require('moment');
const globalConfig = require('../../../../config.js');
const config = require('./config.js');

var lastMeasureDate;

module.exports = function exec(peripheral) {

    console.log(`Found Flower Care, id = ${peripheral.id}, address = ${peripheral.address}.`);

    var now = moment();
    var diff;
    console.log(`this.lastMeasureDate: ${this.lastMeasureDate}`);
    if (this.lastMeasureDate) {
        diff = moment.duration(this.lastMeasureDate.diff(now, 'seconds'));
    }

    if (!this.lastMeasureDate || diff >= config.updateInterval) {
        var flora = new MiFlora(peripheral.address);

        flora.connectDevice(peripheral);

        this.lastMeasureDate = now;
    }

    var device = {
        name: emojiStrip(peripheral.advertisement.localName),
        protocol: 'bluetooth',
        service: 'flowercare'
    };

    flora.on('data', function (data) {
        console.log(`data: ${JSON.stringify(data)}`);

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
                units: 'us/cm',
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

                return null;
            })
            .catch((err) => {
                console.log('Error while sending data to Gladys');
                console.log(err);
                console.log(err.statusCode);
            });
    });

    flora.on('firmware', function (data) {
        console.log(`firmware: ${JSON.stringify(data)}`);

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
    }
};