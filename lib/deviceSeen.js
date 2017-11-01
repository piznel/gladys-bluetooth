const emojiStrip = require('emoji-strip');
const defaultExec = require('./defaultExec.js');

// Compatibilities
const miflora = require('../lib/compatibilities/miflora');

module.exports = function deviceSeen(peripheral) {
    // if the bluetooth device does not have a name, 
    // don't handle it
    if (!peripheral.advertisement.localName) {
        return;
    }

    var localName = emojiStrip(peripheral.advertisement.localName);

    console.log(`Found Bluetooth peripheral, name = ${localName}, id = ${peripheral.id}, address = ${peripheral.address}.`);

    switch (localName) {
        // Xiaomi Flower Care (mi flora)
        case 'Flower care':
            return miflora().exec(peripheral);
            break;

        default:
            return defaultExec(peripheral);
            break;
    }
};