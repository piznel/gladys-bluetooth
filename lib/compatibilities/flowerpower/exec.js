const Promise = require('bluebird');
const rp = require('request-promise');
const FlowerPower = require('flower-power');
const globalConfig = require('../../../config.js');
const shared = require('../../shared.js');
const config = require('./config.js');

var delays = {
  airTemperature: intervalToDelay(config.updateIntervalAirTemperature),
  soilTemperature: intervalToDelay(config.updateIntervalSoilTemperature),
  light: intervalToDelay(config.updateIntervalLight),
  moisture: intervalToDelay(config.updateIntervalMoisture),
  soilEC: intervalToDelay(config.updateIntervalSoilEC),
  batteryLevel: intervalToDelay(config.updateIntervalBatteryLevel)
};

module.exports = function exec(peripheral) {
  var flowerPower = new FlowerPower(peripheral);
console.log(`flowerpower start - ${flowerPower}`);
  var now = new Date();
  var hasCalibratedData = false;

  var identifier;
  if (peripheral.address && peripheral.address !== 'unknown') {
    identifier = peripheral.address;
  } else {
    identifier = peripheral.id;
  }

  // We look in local memory DB is the bluetooth device exists and is known.
  if (shared.devices[identifier]) {
    var localDevicetypes;
    var toUpdate = false;

    var options = {
      method: 'GET',
      uri: `${globalConfig.gladysUrl}/device/${shared.devices[identifier].id}/devicetype?token=${globalConfig.token}`,
      json: true
    };

    rp(options)
      .then(function (devicetypes) {
        localDevicetypes = devicetypes;

        // For each DeviceType
        Promise.map(devicetypes, function (devicetype) {
          // Get last change date of the DeviceType
          var lastChanged = new Date(devicetype.lastChanged);
          var delay = now - lastChanged;

          // Is update needed?
          toUpdate = !lastChanged || delay >= delays[devicetype.type];
        })
          .then(function () {
            if (toUpdate) {
              flowerPower.connectAndSetup(function (err) {
                if (err) {
                  console.error(`flowerpower - Error while connecting to Flower Power ${identifier}:`);
                  console.error(err);
                }
              });

              Promise.map(localDevicetypes, function (devicetype) {
                sendDevicestate(devicetype);
              })
                .then(function () {
                  if (peripheral.state === 'connected') {
                    console.log(`flowerpower - disconnectDevice ${identifier}`);
                    flowerPower.disconnect();
                  }
                });
            }
          });
      })
      .catch(function (err) {
        console.error('flowerpower - Error while getting DeviceTypes from Gladys:');
        console.error(err);
      });
  }

  function sendDevicestate(devicetype) {
    console.log(`flowerpower sending - ${flowerPower}`);
    var lastChanged = new Date(devicetype.lastChanged);
    var type = devicetype.type;

    if (!lastChanged || (now - lastChanged) >= delays[type]) {
      switch (type) {
        case 'airTemperature':
          flowerPower.readAirTemperature(function (error, temperature) {
            console.log(`flowerpower - airTemperature: ${temperature} - ${error}`);
            setDevicestate(devicetype.id, temperature)
              .then(function (parsedResult) {
                console.log(`DeviceType "${parsedResult.devicetype}" and DeviceState "${type}" inserted with success !`);
              })
              .catch(function (err) {
                logSendingError(err, type);
              });
          });
          break;

        case 'soilTemperature':
          flowerPower.readSoilTemperature(function (error, temperature) {
            console.log(`flowerpower - soilTemperature: ${temperature} - ${error}`);
            setDevicestate(devicetype.id, temperature)
              .then(function (parsedResult) {
                console.log(`DeviceType "${parsedResult.devicetype}" and DeviceState "${type}" inserted with success !`);
              })
              .catch(function (err) {
                logSendingError(err, type);
              });
          });

          break;

        case 'light':
          flowerPower.readSunlight(function (error, sunlight) {
            console.log(`flowerpower - light: ${sunlight} - ${error}`);
            setDevicestate(devicetype.id, sunlight)
              .then(function (parsedResult) {
                console.log(`DeviceType "${parsedResult.devicetype}" and DeviceState "${type}" inserted with success !`);
              })
              .catch(function (err) {
                logSendingError(err, type);
              });
          });
          break;

        case 'moisture':
          flowerPower.readSoilMoisture(function (error, soilMoisture) {
            console.log(`flowerpower - moisture: ${soilMoisture} - ${error}`);
            setDevicestate(devicetype.id, soilMoisture)
              .then(function (parsedResult) {
                console.log(`DeviceType "${parsedResult.devicetype}" and DeviceState "${type}" inserted with success !`);
              })
              .catch(function (err) {
                logSendingError(err, type);
              });
          });
          break;

        case 'soilEC':
          flowerPower.readSoilElectricalConductivity(function (error, soilEC) {
            console.log(`flowerpower - soilEC: ${soilEC} - ${error}`);
            setDevicestate(devicetype.id, soilEC)
              .then(function (parsedResult) {
                console.log(`DeviceType "${parsedResult.devicetype}" and DeviceState "${type}" inserted with success !`);
              })
              .catch(function (err) {
                logSendingError(err, type);
              });
          });
          break;

        case 'batteryLevel':
          flowerPower.readBatteryLevel(function (error, batteryLevel) {
            console.log(`flowerpower - batteryLevel: ${batteryLevel} - ${error}`);
            setDevicestate(devicetype.id, batteryLevel)
              .then(function (parsedResult) {
                console.log(`DeviceType "${parsedResult.devicetype}" and DeviceState "${type}" inserted with success !`);
              })
              .catch(function (err) {
                logSendingError(err, type);
              });
          });
          break;

        default:
          break;
      }
    }
  }
};

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

function logSendingError(err, type) {
  console.error(`flowerpower - Error while sending ${type} to Gladys:`);
  console.error(err);
}

function intervalToDelay(interval) {
  return parseInt(interval, 10) * 60 * 1000;
}