module.exports = {
    scanInterval: process.env.BLUETOOTH_SCAN_INTERVAL || 60000, // Interval between Bluetooth scans
    scanTimeout: process.env.BLUETOOTH_SCAN_TIMEOUT || 30000,
    gladysUrl: process.env.GLADYS_URL || 'http://localhost:1337', // the URL of your main Gladys Instance
    token: process.env.GLADYS_TOKEN || 'your-gladys-token',
    gladysHouseId: process.env.GLADYS_HOUSE_ID || 1, // the ID of the house where this Bluetooth Scanner is located
};