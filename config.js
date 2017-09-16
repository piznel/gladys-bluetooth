module.exports = {
    scanInterval: process.env.BLUETOOTH_SCAN_INTERVAL || 60000, // Interval between Bluetooth scans
    scanTimeout: process.env.BLUETOOTH_SCAN_TIMEOUT || 30000,
    gladysUrl: process.env.GLADYS_URL || 'http://localhost:1337', // the URL of your main Gladys Instance
    token: process.env.GLADYS_TOKEN || '7cecaa4e9c10f30fcfc02d9bbe08851bdc2d8884',
    gladysHouseId: process.env.GLADYS_HOUSE_ID || 1, // the ID of the house where this Bluetooth Scanner is located
};