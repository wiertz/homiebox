var HID = require('node-hid');
var devices = HID.devices();

console.log(devices)
