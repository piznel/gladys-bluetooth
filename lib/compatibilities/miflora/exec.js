const Promise = require('bluebird');
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
      //console.log(`miflora - data received: ${JSON.stringify(data)}`);

      rp(options)
        .then(function (devicetypes) {
          Promise.map(devicetypes, function (devicetype) {
            sendDevicestate(devicetype, data);
          })
          .then(function () {
            console.log(`miflora - data received OK`);
            dataReceived = true;
            // When both response are received
            if (dataReceived && firmwareReceived) {
              dataReceived = false;
              firmwareReceived = false;

              miFlora.disconnectDevice(peripheral);
              //console.log(`miflora - disconnectDevice`);
            }
          });
        })
        .catch(function (err) {
          console.error('miflora - Error while getting devicetypes to Gladys:');
          console.error(err);
        });
    })
    .once('end', function () {
      miFlora.removeAllListeners('data')
    });

    miFlora.on('firmware', function (data) {
      //console.log(`miflora - data received: ${JSON.stringify(data)}`);

      rp(options)
        .then(function (devicetypes) {
          Promise.map(devicetypes, function (devicetype) {
            sendDevicestate(devicetype, data);
          })
          .then(function () {
            console.log(`miflora - firmware received OK`);
            firmwareReceived = true;
            // When both response are received
            if (dataReceived && firmwareReceived) {
              firmwareReceived = false;
              dataReceived = false;
      
              miFlora.disconnectDevice(peripheral);
              //console.log(`miflora - disconnectDevice`);
            }
          });
        })
        .catch(function (err) {
          console.error('miflora - Error while getting devicetypes to Gladys:');
          console.error(err);
        });
    })
    .once('end', function () {
      miFlora.removeAllListeners('firmware')
    });

  }

  function sendDevicestate(devicetype, data) {
    var lastChanged = new Date(devicetype.lastChanged);
    var type = devicetype.type;

    switch (type) {
      case 'temperature':
        if (!lastChanged || (now - lastChanged) >= mesureDelayTemperature) {
          setDevicestate(devicetype.id, data.temperature)
            .then(function (parsedResult) {
              console.log(`DeviceType "${parsedResult.devicetype}" and DeviceState "${type}" inserted with success !`);
            })
            .catch(function (err) {
              logError(err, type);
            });
        }
        break;
      case 'lux':
        if (!lastChanged || (now - lastChanged) >= mesureDelayLux) {
          setDevicestate(devicetype.id, data.lux)
            .then(function (parsedResult) {
              console.log(`DeviceType "${parsedResult.devicetype}" and DeviceState "${type}" inserted with success !`);
            })
            .catch(function (err) {
              logError(err, type);
            });
        }
        break;
      case 'moisture':
        if (!lastChanged || (now - lastChanged) >= mesureDelayMoisture) {
          setDevicestate(devicetype.id, data.moisture)
            .then(function (parsedResult) {
              console.log(`DeviceType "${parsedResult.devicetype}" and DeviceState "${type}" inserted with success !`);
            })
            .catch(function (err) {
              logError(err, type);
            });
        }
        break;
      case 'fertility':
        if (!lastChanged || (now - lastChanged) >= mesureDelayFertility) {
          setDevicestate(devicetype.id, data.fertility)
            .then(function (parsedResult) {
              console.log(`DeviceType "${parsedResult.devicetype}" and DeviceState "${type}" inserted with success !`);
            })
            .catch(function (err) {
              logError(err, type);
            });
        }
        break;
      case 'batteryLevel':
        if (!lastChanged || (now - lastChanged) >= mesureDelayBatteryLevel) {
          setDevicestate(devicetype.id, data.batteryLevel)
            .then(function (parsedResult) {
              console.log(`DeviceType "${parsedResult.devicetype}" and DeviceState "${type}" inserted with success !`);
            })
            .catch(function (err) {
              logError(err, type);
            });
        }
        break;
      default:
        break;
    }
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
  }

  function logError(err, type) {
    console.error(`'miflora - Error while sending ${type} to Gladys:`);
    console.error(err);
  }

}
