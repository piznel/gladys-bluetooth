const noble = require('noble');
const config = require('../config.js');

module.exports = function scan(callback) {
  var bluetoothOn = false;

  function start() {
    if (bluetoothOn) {
      console.log(`Starting Bluetooth Scan for ${config.scanTimeout/1000} seconds !`);
      noble.startScanning();
      setTimeout(stop, config.scanTimeout);
    }
  }

  function stop(){
    console.log(`Stopping Bluetooth Scan for ${config.scanInterval/1000} seconds !`);
    noble.stopScanning();
    setTimeout(start, config.scanInterval);
  }

  noble.on('stateChange', function (state) {
    if (state === 'poweredOn') {
      bluetoothOn = true;
      start();
    }

    if (state === 'poweredOff') {
      bluetoothOn = false;
      noble.stopScanning();
    }
  });

  noble.on('discover', function (peripheral) {
    callback(peripheral);
  });

  noble.on('scanStop', function () {
    console.log('Bluetooth Scan stopped');
  });
}
