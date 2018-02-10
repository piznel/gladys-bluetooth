const Promise = require('bluebird');
const config = require('./config.js');
const scan = require('./lib/scan.js');
const deviceSeen = require('./lib/deviceSeen.js');
const getDevices = require('./lib/getDevices.js');
const shared = require('./lib/shared.js');

scan(deviceSeen);

var services = config.services.split(',');

Promise.map(services, (service) => {
  return getDevices(service);
})
.then((devices) => {
  // saving devices by identifier
  devices.forEach((device) => {
    shared.devices[device.identifier] = device;
  });
})
.catch((err) => {
  console.log(`Error while getting devices from Gladys:`);
  console.log(err);
});
