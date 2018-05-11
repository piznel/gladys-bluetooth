const Promise = require('bluebird');
const rp = require('request-promise');
const async = require('async');
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
    var toUpdate = false;
    var typeToUpdate = [];
    var devicetypeId = [];

    var options = {
      method: 'GET',
      uri: `${globalConfig.gladysUrl}/device/${shared.devices[identifier].id}/devicetype?token=${globalConfig.token}`,
      json: true
    };

    rp(options)
      .then(function (devicetypes) {
        // For each DeviceType
        Promise.map(devicetypes, function (devicetype) {
          devicetypeId[devicetype.type] = devicetype.id;

          // Get last change date of the DeviceType
          var lastChanged = new Date(devicetype.lastChanged);
          var delay = now - lastChanged;

          // Is update needed?
          typeToUpdate[devicetype.type] = !lastChanged || delay >= delays[devicetype.type];
          toUpdate = toUpdate || !lastChanged || typeToUpdate[devicetype.type];

          console.log(`flowerpower - ${devicetype.type} to update: ${typeToUpdate[devicetype.type]}`);
        })
          .then(function () {
            if (toUpdate) {
              FlowerPower.discoverById(peripheral.id, function(flowerPower) {
                console.log(`flowerpower discovered - ${flowerPower}`);
                async.series([
                  function(callback) {
                    flowerPower.on('disconnect', function() {
                      console.log(`flowerpower - disconnected! :(`);
                    });

                    flowerPower.connect(callback);
                  },
                  function(callback) {
                    flowerPower.discoverServicesAndCharacteristics(callback);
                  },
                  function(callback) {
                    var type = 'light';
                    console.log(`flowerpower - processing ${type}`);
                    if (typeToUpdate[type]) {
                      flowerPower.readSunlight(function (error, sunlight) {
                          sendDevicestate(type, devicetypeId[type], sunlight, error);
                      });
                    }
                    callback();
                  },
                  function(callback) {
                    var type = 'airTemperature';
                    console.log(`flowerpower - processing ${type}`);
                    if (typeToUpdate[type]) {
                      flowerPower.readAirTemperature(function (error, temperature) {
                          sendDevicestate(type, devicetypeId[type], temperature, error);
                    });
                    }
                    callback();
                  },
                  function(callback) {
                    var type = 'soilTemperature';
                    console.log(`flowerpower - processing ${type}`);
                    if (typeToUpdate[type]) {
                      flowerPower.readSoilTemperature(function (error, temperature) {
                          sendDevicestate(type, devicetypeId[type], temperature, error);
                      });
                    }
                    callback();
                  },
                  function(callback) {
                    var type = 'moisture';
                    console.log(`flowerpower - processing ${type}`);
                    if (typeToUpdate[type]) {
                      flowerPower.readSoilMoisture(function (error, soilMoisture) {
                          sendDevicestate(type, devicetypeId[type], soilMoisture, error);
                      });
                    }
                    callback();
                  },
                  function(callback) {
                    var type = 'soilEC';
                    console.log(`flowerpower - processing ${type}`);
                    if (typeToUpdate[type]) {
                      flowerPower.readSoilElectricalConductivity(function (error, soilEC) {
                          sendDevicestate(type, devicetypeId[type], soilEC, error);
                      });
                    }
                    callback();
                  },
                  function(callback) {
                    var type = 'batteryLevel';
                    console.log(`flowerpower - processing ${type}`);
                    if (typeToUpdate[type]) {
                      flowerPower.readBatteryLevel(function (error, batteryLevel) {
                        sendDevicestate(type, devicetypeId[type], batteryLevel, error);
                      });
                    }
                    callback();
                  },
                  function(callback) {
                    console.log(`flowerpower - disconnect Device ${identifier}`);
                    flowerPower.disconnect(callback);
                  }
                ])
              });
            }
          });
      })
      .catch(function (err) {
        console.error('flowerpower - Error while getting DeviceTypes from Gladys:');
        console.error(err);
      });
  }

  function sendDevicestate(type, id, value, error) {
    console.log(`flowerpower - ${type}: ${value} - ${error}`);
    setDevicestate(id, value)
      .then(function (parsedResult) {
        console.log(`DeviceType "${parsedResult.devicetype}" and DeviceState "${type}" inserted with success !`);
      })
      .catch(function (err) {
        logSendingError(err, type);
      });
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