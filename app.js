const scan = require('./lib/scan.js');
const deviceSeen = require('./lib/deviceSeen.js');
const getDevices = require('./lib/getDevices.js');

scan(deviceSeen);

getDevices()
    .catch((err) => {
        console.log('Error while getting devices from Gladys');
        console.log(err);
    });

