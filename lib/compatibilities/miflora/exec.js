const rp = require('request-promise');
const emojiStrip = require('emoji-strip');
const globalConfig = require('../../../config.js');
const shared = require('../../shared.js');
const config = require('./config.js');
const MiFlora = require('./MiFlora');

var mesureDelayTemperature = parseInt(config.updateIntervalTemperature, 10) * 60 * 1000;
var mesureDelayLux = parseInt(config.updateIntervalLux, 10) * 60 * 1000;
var mesureDelayMoisture = parseInt(config.updateIntervalMoisture, 10) * 60 * 1000;
var mesureDelayFertility = parseInt(config.updateIntervalFertility, 10) * 60 * 1000;
var mesureDelayBatteryLevel = parseInt(config.updateIntervalBatteryLevel, 10) * 60 * 1000;

module.exports = function exec(peripheral) {
  var identifier;

  if (peripheral.address && peripheral.address !== 'unknown') {
    identifier = peripheral.address;
  } else {
    identifier = peripheral.id;
  }

  // we look in local memory DB is the bluetooth device exists and is known.
  if (shared.devices[identifier]) {
    var dataReceived = false;
    var firmwareReceived = false;
    var now = new Date();
    var miFlora = new MiFlora(peripheral.address);

    var options = {
      method: 'GET',
      uri: `${globalConfig.gladysUrl}/device/${shared.devices[identifier].id}/devicetype?token=${globalConfig.token}`,
      json: true
    };

    miFlora.connectDevice(peripheral);
    //console.log(`miflora - connectDevice`);

    miFlora.on('data', function (data) {
      //console.log(`miflora - data received`);

      rp(options)
        .then((devicetypes) => {
          devicetypes.forEach(function (devicetype) {
            var lastChanged = new Date(devicetype.lastChanged);

            switch (devicetype.type) {
              case 'temperature':
                if (!lastChanged || (now - lastChanged) >= mesureDelayTemperature) {
                  setDevicestate(devicetype.id, data.temperature)
                    .then((parsedResult) => {
                      console.log(`miflora - parsedResult: ${JSON.stringify(parsedResult)}`);
                      console.log(`Device "${parsedResult.device.name}" and DeviceState "${devicetype.type}" inserted with success !`);
                    })
                    .catch((err) => {
                      console.log('miflora - Error while sending temperature to Gladys');
                      console.log(err);
                      console.log(err.statusCode);
                    });
                }
                break;
              case 'lux':
                if (!lastChanged || (now - lastChanged) >= mesureDelayLux) {
                  setDevicestate(devicetype.id, data.lux)
                    .then((parsedResult) => {
                      console.log(`Device "${parsedResult.device.name}" and DeviceState "${devicetype.type}" inserted with success !`);
                    })
                    .catch((err) => {
                      console.log('miflora - Error while sending lux to Gladys');
                      console.log(err);
                      console.log(err.statusCode);
                    });
                }
                break;
              case 'moisture':
                if (!lastChanged || (now - lastChanged) >= mesureDelayMoisture) {
                  setDevicestate(devicetype.id, data.moisture)
                    .then((parsedResult) => {
                      console.log(`Device "${parsedResult.device.name}" and DeviceState "${devicetype.type}" inserted with success !`);
                    })
                    .catch((err) => {
                      console.log('miflora - Error while sending moisture to Gladys');
                      console.log(err);
                      console.log(err.statusCode);
                    });
                }
                break;
              case 'fertility':
                if (!lastChanged || (now - lastChanged) >= mesureDelayFertility) {
                  setDevicestate(devicetype.id, data.fertility)
                    .then((parsedResult) => {
                      console.log(`Device "${parsedResult.device.name}" and DeviceState "${devicetype.type}" inserted with success !`);
                    })
                    .catch((err) => {
                      console.log('miflora - Error while sending fertility to Gladys');
                      console.log(err);
                      console.log(err.statusCode);
                    });
                }
                break;
              default:
                break;
            }
          }, this);
        })
        .catch((err) => {
          console.log('miflora - Error while getting devicetypes to Gladys');
          console.log(err);
          console.log(err.statusCode);
        });

      dataReceived = true;
      // When both response are received
      if (dataReceived && firmwareReceived) {
        dataReceived = false;
        firmwareReceived = false;

        miFlora.disconnectDevice(peripheral);
        //console.log(`miflora - disconnectDevice`);
      }
    });

    miFlora.on('firmware', function (data) {
      //console.log(`miflora - firmware received`);

      rp(options)
        .then((devicetypes) => {
          devicetypes.forEach(function (devicetype) {
            var lastChanged = new Date(devicetype.lastChanged);

            switch (devicetype.type) {
              case 'batteryLevel':
                if (!lastChanged || (now - lastChanged) >= mesureDelayBatteryLevel) {
                  setDevicestate(devicetype.id, data.batteryLevel)
                    .then((parsedResult) => {
                      console.log(`Device "${parsedResult.device.name}" and DeviceState "${devicetype.type}" inserted with success !`);
                    })
                    .catch((err) => {
                      console.log('miflora - Error while sending batteryLevel to Gladys');
                      console.log(err);
                      console.log(err.statusCode);
                    });
                }
                break;
              default:
                break;
            }
          }, this);
        })
        .catch((err) => {
          console.log('miflora - Error while getting devicetypes to Gladys');
          console.log(err);
          console.log(err.statusCode);
        });

      firmwareReceived = true;
      // When both response are received
      if (dataReceived && firmwareReceived) {
        firmwareReceived = false;
        dataReceived = false;

        miFlora.disconnectDevice(peripheral);
        //console.log(`miflora - disconnectDevice`);
      }
    });

    function setDevicestate(id, value) {
      var options = {
        method: 'POST',
        uri: `${globalConfig.gladysUrl}/devicestate?token=${globalConfig.token}`,
        body: {
          devicetype: id,
          value: value
        },
        json: true
      };

      return rp(options);
    };
  }

  function setDevicestate(id, value) {
    var options = {
      method: 'POST',
      uri: `${globalConfig.gladysUrl}/devicestate?token=${globalConfig.token}`,
      body: {
        devicetype: id,
        value: value
      },
      json: true
    };

    return rp(options);
  };

};