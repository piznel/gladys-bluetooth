const rp = require('request-promise');
const globalConfig = require('../../../config');

module.exports = function createDevice(peripheral) {

  var device = {
    name: 'Flower care',
    protocol: 'bluetooth',
    service: 'miflora'
  };

  if (peripheral.address && peripheral.address !== 'unknown') {
    device.identifier = peripheral.address;
  } else {
    device.identifier = peripheral.id;
  }

  var types = [{
    type: 'temperature',
    name: 'Temperature',
    identifier: 'temperature',
    unit: '°C',
    sensor: true,
    min: -30,
    max: 50
  },
  {
    type: 'light',
    name: 'Light',
    identifier: 'light',
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
  },
  {
    type: 'batteryLevel',
    name: 'Battery Level',
    identifier: 'batteryLevel',
    unit: '%',
    sensor: true,
    min: 0,
    max: 100
  }];

  var options = {
    method: 'POST',
    uri: `${globalConfig.gladysUrl}/device?token=${globalConfig.token}`,
    body: {
      device,
      types
    },
    json: true
  };

  return rp(options)
    .then((newDevice) => {
      console.log(`Device "${device.name}" inserted with success !`);
      return newDevice;
    });
};