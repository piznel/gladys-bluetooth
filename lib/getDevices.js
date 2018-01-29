const rp = require('request-promise');
const config = require('../config.js');
const shared = require('./shared.js');

module.exports = function getDevices() {

  // get all bluetooth devices
  var options = {
    method: 'GET',
    uri: `${config.gladysUrl}/device?token=${config.token}&service=bluetooth&take=1000000`,
    json: true
  };

  return rp(options)
    .then((devices) => {
        console.log(`Just received ${devices.length} devices from Gladys. Saving them locally in RAM.`);

        // saving devices by identifier
        devices.forEach((device) => {
            shared.devices[device.identifier] = device;
        });

        return null;
    });
};