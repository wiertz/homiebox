const HID = require('node-hid')
const events = require('events')


const settings = require('./settings.json')


const nfcEvents = new events.EventEmitter()
const nfcReader = new HID.HID(settings.nfcHidPath)

const keymap = { '04': 'A', '05': 'B', '06': 'C', '07': 'D', '08': 'E', '09': 'F', '0a': 'G', '0b': 'H', '0c': 'I', '0d': 'J', '0e': 'K', '0f': 'L', '10': 'M', '11': 'N', '12': 'O', '13': 'P', '14': 'Q', '15': 'R', '16': 'S', '17': 'T', '18': 'U', '19': 'V', '1a': 'W', '1b': 'X', '1c': 'Y', '1d': 'Z', '1e': '1', '1f': '2', '20': '3', '21': '4', '22': '5', '23': '6', '24': '7', '25': '8', '26': '9', '27': '0', '00': '' }
let nfcKeyBuffer = ''

nfcReader.on('data', async (data) => {
    let fragment = Buffer.from([data[2]])
    let fragmentValue = keymap[fragment.toString('hex')]
    if (fragmentValue == undefined) {
        if (nfcKeyBuffer) {
            nfcEvents.emit('nfcRead', nfcKeyBuffer)
            nfcKeyBuffer = ''
        }
    } else {
        nfcKeyBuffer += keymap[fragment.toString('hex')]
    }
})

module.exports = nfcEvents