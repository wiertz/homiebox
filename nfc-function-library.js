const state = require('./app-state')
const log = require('./log')
const playback = require('./control-playback')

module.exports = {
    '0007935219': function() {
        log('debug', 'changing state.lock to ' + !state.log)
        state.lock = !state.lock
    },
    '9999999999': function() {
        // Change the number to a valid nfc key and uncomment the following line
        // to use nfc key card to start/stop playback. Alternatively, choose any other
        // playback function (or create your own).

        // playback.playPause()
    }
}