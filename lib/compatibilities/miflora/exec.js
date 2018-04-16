const Promise = require('bluebird');
const rp = require('request-promise');
const globalConfig = require('../../../config.js');
const shared = require('../../shared.js');
const config = require('./config.js');
const MiFlora = require('./MiFlora');

var delays = {
  temperature: intervalToDelay(config.updateIntervalTemperature),
  lux: intervalToDelay(config.updateIntervalLux),
  moisture: intervalToDelay(config.updateIntervalMoisture),
  fertility: intervalToDelay(config.updateIntervalFertility),
  batteryLevel: intervalToDelay(config.updateIntervalBatteryLevel)
};

module.exports = function exec(peripheral) {
  var miFlora = new MiFlora(peripheral.address);
  var now = new Date();
  var localDevicetypes;
  var dataReceived = {
    data: false,
    firmware: false
  };

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
    console.log(`miflora - ${origin} received: ${JSON.stringify(data)}`);
    Promise.map(localDevicetypes, function (devicetype) {
      var lastChanged = new Date(devicetype.lastChanged);
      if (!lastChanged || (now - lastChanged) >= delays[devicetype.type]) {
        setDeviceState(devicetype.type, devicetype.id, data[devicetype.type]);
      }
    })
    .then(function () {
      console.log(`miflora - ${origin} received OK`);
      dataReceived[origin] = true;

      // When both response are received
      if (dataReceived.data && dataReceived.firmware) {
        dataReceived.data = false;
        dataReceived.firmware = false;

        //console.log(`miflora - disconnect Device ${identifier}`);
        miFlora.disconnectDevice(peripheral);
      }
    });
  }
};

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

  rp(options)
    .then(function (parsedResult) {
      console.log(`miflora - DeviceType "${parsedResult.devicetype}" and DeviceState "${type}" inserted with success !`);
    })
    .catch(function (err) {
      console.error(`miflora - Error while sending DeviceState "${type}" to Gladys:`);
      console.error(err);
    });
}

function intervalToDelay(interval) {
  return parseInt(interval, 10) * 60 * 1000;
}