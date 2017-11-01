const EventEmitter = require('events');
//const noble = require('noble');
//const debug = require('debug')('miflora');

//const DEFAULT_DEVICE_NAME = 'Flower care';
const DATA_SERVICE_UUID = '0000120400001000800000805f9b34fb';
const DATA_CHARACTERISTIC_UUID = '00001a0100001000800000805f9b34fb';
const FIRMWARE_CHARACTERISTIC_UUID = '00001a0200001000800000805f9b34fb';
const REALTIME_CHARACTERISTIC_UUID = '00001a0000001000800000805f9b34fb';
const REALTIME_META_VALUE = Buffer.from([0xA0, 0x1F]);

const SERVICE_UUIDS = [DATA_SERVICE_UUID];
const CHARACTERISTIC_UUIDS = [DATA_CHARACTERISTIC_UUID, FIRMWARE_CHARACTERISTIC_UUID, REALTIME_CHARACTERISTIC_UUID];

class MiFlora extends EventEmitter {
    constructor(macAddress) {
        super();
        //this.noble = noble;
        this._macAddress = macAddress;
        //noble.on('discover', this.discover.bind(this));
    }

    /*discover(peripheral) {
        console.log(`device discovered: ${peripheral.advertisement.localName}`);
        if (this._macAddress !== undefined) {
            if (this._macAddress.toLowerCase() === peripheral.address.toLowerCase()) {
                console.log(`trying to connect mi flora, living at ${this._macAddress}`);
                // start listening the specific device
                this.connectDevice(peripheral);
            }
        } else if (peripheral.advertisement.localName === DEFAULT_DEVICE_NAME) {
            console.log('no mac address specified, trying to connect available mi flora...');
            // start listening found device
            this.connectDevice(peripheral);
        }
    }*/

    connectDevice(peripheral) {
        // prevent simultanious connection to the same device
        if (peripheral.state === 'disconnected') {
            peripheral.connect();
            peripheral.once('connect', function () {
                this.listenDevice(peripheral, this);
            }.bind(this));
        }
    }

    listenDevice(peripheral, context) {
        peripheral.discoverSomeServicesAndCharacteristics(SERVICE_UUIDS, CHARACTERISTIC_UUIDS, function (error, services, characteristics) {
            characteristics.forEach(function (characteristic) {
                switch (characteristic.uuid) {
                    case DATA_CHARACTERISTIC_UUID:
                        characteristic.read(function (error, data) {
                            context.parseData(peripheral, data);
                        });
                        break;
                    case FIRMWARE_CHARACTERISTIC_UUID:
                        characteristic.read(function (error, data) {
                            context.parseFirmwareData(peripheral, data);
                        });
                        break;
                    case REALTIME_CHARACTERISTIC_UUID:
                        console.log('enabling realtime');
                        characteristic.write(REALTIME_META_VALUE, false);
                        break;
                    default:
                        console.log(`found characteristic uuid ${characteristic.uuid} but not matched the criteria`);
                }
            });
        });
    }

    parseData(peripheral, data) {
        let temperature = data.readUInt16LE(0) / 10;
        let lux = data.readUInt32LE(3);
        let moisture = data.readUInt16BE(6);
        let fertility = data.readUInt16LE(8);

        let deviceData = {
            deviceId: peripheral.id,
            temperature: temperature,
            lux: lux,
            moisture: moisture,
            fertility: fertility
        };
        this.emit('data', deviceData);
    }

    parseFirmwareData(peripheral, data) {
        let batteryLevel = parseInt(data.toString('hex', 0, 1), 16);
        let firmwareVersion = data.toString('ascii', 2, data.length);

        let firmware = {
            deviceId: peripheral.id,
            batteryLevel: batteryLevel,
            firmwareVersion: firmwareVersion
        };
        this.emit('firmware', firmware);
    }
/*
    startScanning() {
        if (noble.state === 'poweredOn') {
            noble.startScanning([], true);
        } else {
            // bind event to start scanning
            noble.on('stateChange', function (state) {
                if (state === 'poweredOn') {
                    noble.startScanning([], true);
                }
            });
        }
    }

    stopScanning() {
        noble.stopScanning();
    }
*/
}

module.exports = MiFlora;