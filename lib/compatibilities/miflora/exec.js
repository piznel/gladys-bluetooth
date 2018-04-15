const Promise = require('bluebird');
const rp = require('request-promise');
const globalConfig = require('../../../config.js');
const shared = require('../../shared.js');
const config = require('./config.js');
const MiFlora = require('./MiFlora');

var mesureDelayTemperature = intervalToDelay(config.updateIntervalTemperature);
var mesureDelayLux = intervalToDelay(config.updateIntervalLux);
var mesureDelayMoisture = intervalToDelay(config.updateIntervalMoisture);
var mesureDelayFertility = intervalToDelay(config.updateIntervalFertility);
var mesureDelayBatteryLevel = intervalToDelay(config.updateIntervalBatteryLevel);

module.exports = function exec(peripheral) {
  var miFlora = new MiFlora(peripheral.address);
  var now = new Date();
  var localDevicetypes;
  var dataReceived = false;
  var firmwareReceived = false;

  var identifier;
  if (peripheral.address && peripheral.address !== 'unknown') {
    identifier = peripheral.address;
  } else {
    identifier = peripheral.id;
  }

  // We look in local memory DB is the bluetooth device exists and is known.
  if (shared.devices[identifier]) {
    var toUpdate = false;

    var options = {
      method: 'GET',
      uri: `${globalConfig.gladysUrl}/device/${shared.devices[identifier].id}/devicetype?token=${globalConfig.token}`,
      json: true
    };

    rp(options).then(function (devicetypes) {
      localDevicetypes = devicetypes;

      // For each DeviceType
      Promise.map(devicetypes, function (devicetype) {
        // Get last change date of the DeviceType
        var lastChanged = new Date(devicetype.lastChanged);
        var delay = now - lastChanged;

        // Is update needed?
        if (!lastChanged || delay >= mesureDelayTemperature || delay >= mesureDelayLux || delay >= mesureDelayMoisture ||
          delay >= mesureDelayFertility || delay >= mesureDelayBatteryLevel) {
          toUpdate = true;
        }
      })
      .then(function () {
        if (toUpdate) {
          //console.log(`miflora - connect Device ${identifier}`);
          miFlora.connectDevice(peripheral);
        }

        miFlora.on('data', function (data) {
            processData('data', data);
        })
        .once('end', function () {
          miFlora.removeAllListeners('data')
        });

        miFlora.on('firmware', function (data) {
          processData('firmware', data);
        })
        .once('end', function () {
          miFlora.removeAllListeners('firmware')
        });
      });
    })
    .catch(function (err) {
      console.error('miflora - Error while getting DeviceTypes from Gladys:');
      console.error(err);
    });

  }

  function processData(origin, data) {
    console.log(`miflora - data received: ${JSON.stringify(data)}`);
    Promise.map(localDevicetypes, function (devicetype) {
      sendDeviceState(devicetype, data);
    })
    .then(function () {
      console.log(`miflora - ${origin} received OK`);
      dataReceived = origin === 'data';
      firmwareReceived = origin === 'firmware';

      // When both response are received
      if (dataReceived && firmwareReceived) {
        firmwareReceived = false;
        dataReceived = false;

        //console.log(`miflora - disconnect Device ${identifier}`);
        miFlora.disconnectDevice(peripheral);
      }
    });
  }

  function sendDeviceState(devicetype, data) {
    var lastChanged = new Date(devicetype.lastChanged);
    var type = devicetype.type;

    switch (type) {
      case 'temperature':
        if (!lastChanged || (now - lastChanged) >= mesureDelayTemperature) {
          setDeviceState(type, devicetype.id, data.temperature);
        }
        break;

      case 'lux':
        if (!lastChanged || (now - lastChanged) >= mesureDelayLux) {
          setDeviceState(type, devicetype.id, data.lux);
        }
        break;

      case 'moisture':
        if (!lastChanged || (now - lastChanged) >= mesureDelayMoisture) {
          setDeviceState(type, devicetype.id, data.moisture);
        }
        break;

      case 'fertility':
        if (!lastChanged || (now - lastChanged) >= mesureDelayFertility) {
          setDeviceState(type, devicetype.id, data.fertility);
        }
        break;

      case 'batteryLevel':
        if (!lastChanged || (now - lastChanged) >= mesureDelayBatteryLevel) {
          setDeviceState(type, devicetype.id, data.batteryLevel);
        }
        break;

      default:
        break;
    }
  }

  function setDeviceState(type, id, value) {
    var options = {
      method: 'POST',
      uri: `${globalConfig.gladysUrl}/devicestate?token=${globalConfig.token}`,
      body: {
        devicetype: id,
        value: value
      },
      json: true
    };

    rp(options).then(function (parsedResult) {
      console.log(`miflora - DeviceType "${parsedResult.devicetype}" and DeviceState "${type}" inserted with success !`);
    })
    .catch(function (err) {
      console.error(`miflora - Error while sending DeviceState "${type}" to Gladys:`);
      console.error(err);
    });
  }
};

function intervalToDelay(interval) {
  return parseInt(interval, 10) * 60 * 1000;
}