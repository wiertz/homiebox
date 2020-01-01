
// Load global app state and log function
const log = require('./log')
const state = require('./app-state.js')

// Load settings
const settings = require('./settings.json')
const nfcMusic = require(settings.nfcMusicLibrary)
const nfcFunctions = require('./nfc-function-library')

// Load control functions
const nfcEvents = require('./nfc-events')
const gpioEvents = require('./gpio-events')
const playback = require('./control-playback')


// React on nfc input
nfcEvents.on('nfcRead', async nfcKey => {

    log('info', 'NFC key:' + nfcKey)

    // If nfc key is assigned to a function, execute the function
    if (nfcFunctions[nfcKey]) {
        log('debug', 'Executing function linked to key')
        nfcFunctions[nfcKey]()
        return
    }

    // If nfc key is assigned to music, play music
    if (nfcMusic[nfcKey]) {
        playback.playDirectory(nfcMusic[nfcKey])
        state.activeNfc = nfcKey
        return
    }
})


// React on gpio button events
gpioEvents.on('playPause', playback.playPause)
gpioEvents.on('nextTrack', playback.nextTrack)
gpioEvents.on('previousTrack', playback.previousTrack)

gpioEvents.on('volumeDown', () => {
    playback.changeVolume('decrease',
        settings.volume.step || 10,
        settings.volume.min || 0,
        settings.volume.max || 100)
})

gpioEvents.on('volumeUp', () => {
    playback.changeVolume('increase',
    settings.volume.step || 10,
    settings.volume.min || 0,
    settings.volume.max || 100)
})