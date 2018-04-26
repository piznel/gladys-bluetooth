const rp = require('request-promise');
const config = require('../config.js');
const emojiStrip = require('emoji-strip');

// Compatibilities
const miflora = require('./compatibilities/miflora');
const xiaomiht = require('./compatibilities/xiaomiht');
const flowerpower = require('./compatibilities/flowerpower');

module.exports = function createDevice(peripheral) {

  // if the bluetooth device does not have a name, 
  // don't handle it
  if (!peripheral.advertisement.localName) {
    return;
  }

  var localName = emojiStrip(peripheral.advertisement.localName);

  console.log(`Found Bluetooth peripheral, name = ${localName}, id = ${peripheral.id}, address = ${peripheral.address}.`);

  switch (peripheral.address.substring(0, 9)) {
    // Xiaomi Flower Care (mi flora)
    case 'c4:7c:8d:':
      return miflora().createDevice(peripheral);
      break;

    // Xiaomi Hygrothermographe (xiaomi ht)
    case '4c:65:a8:':
      return xiaomiht().createDevice(peripheral);
      break;

    // Parrot Flower Power (flowerpower)
    case 'a0:14:3d:':
      return flowerpower().createDevice(peripheral);
      break;

    default:
      return createDefaultDevice(peripheral);
      break;
  }

  function createDefaultDevice(peripheral) {

    var device = {
      name: emojiStrip(peripheral.advertisement.localName),
      protocol: 'bluetooth',
      service: 'bluetooth'
    };

    if (peripheral.address && peripheral.address !== 'unknown') {
      device.identifier = peripheral.address;
    } else {
      device.identifier = peripheral.id;
    }

    var types = [{
      type: 'multilevel',
      name: 'rssi',
      identifier: 'rssi',
      units: 'dBm',
      sensor: true,
      min: -9999,
      max: 9999
    }];

    var options = {
      method: 'POST',
      uri: `${config.gladysUrl}/device?token=${config.token}`,
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
  }
};