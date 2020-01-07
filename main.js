
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
const control = require('./control')


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
        control.playDirectory(nfcMusic[nfcKey])
        state.activeNfc = nfcKey
        return
    }
})


// React on gpio button events
gpioEvents.on('playPause', control.playPause)
gpioEvents.on('nextTrack', control.nextTrack)
gpioEvents.on('previousTrack', control.previousTrack)

gpioEvents.on('volumeDown', () => {
    control.changeVolume('decrease',
        settings.volume.step || 10,
        settings.volume.min || 0,
        settings.volume.max || 100)
})

gpioEvents.on('volumeUp', () => {
    control.changeVolume('increase',
    settings.volume.step || 10,
    settings.volume.min || 0,
    settings.volume.max || 100)
})

gpioEvents.on('sleepTimer', async () => {
    control.sleepTimer(settings.sleepTimer || 30)
})

gpioEvents.on('shutdown', () => {
    control.shutdown()
})

