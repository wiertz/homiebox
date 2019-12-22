const Mopidy = require('mopidy')


//// DO THINGS AT STARTUP

// Read logging utility function.
const log = require('./log')

const settings = require('./settings.json')

// Read pairs of directories and nfc ids.
const nfcLibrary = require(settings.nfcLibrary)

// Throws event if new nfc card is read.
// Event name: 'nfcRead', returned data: nfc id.
// (Adapt or replace 'nfc-events.js' to make homiebox work with your reader)
const nfcEvents = require('./nfc-events')

// Throws events on GPIO button press.
// Events: 'playPause', 'nextTrack', 'previousTrack', 'volumeUp', 'volumeDown'
const gpioEvents = require('./gpio-events')

// Connect to mopidy server
const mopidy = new Mopidy({
    webSocketUrl: settings.mopidyWebSocketUrl,
    callingConvention: "by-position-or-by-name"
})

// Set playback state of homiebox.
// 'state.ready' tells whether connection to mopidy is ready.
// 'state.activeNfc' contains the last nfc id that was played.
let state = {}
state.activeNfc = ''
state.volume = null

// Listen to mopidy events, set homiebox state accordingly, 
// and log events to console (info/debugging)
mopidy.on('state:online', async () => {
    // Refresh library once on startup
    mopidy.library.refresh({ "uri": null })
    await mopidy.mixer.setVolume({ volume: 5 })
    // Log list of current directories (info/debugging)
    const dirs = await mopidy.library.browse({ uri: 'local:directory' })
    log('debug', dirs)
    log('debug', 'Volume: ' + await mopidy.mixer.getVolume())
})


//// REACT ON NFC CARD HAVING BEEN READ

nfcEvents.on('nfcRead', async nfcKey => {
    log('info', 'NFC key:' + nfcKey)

    // If the nfc id is not the one currently playing AND has a matching music folder,
    // play the folder linked to this nfc id
    if (nfcKey != state.activeNfc && nfcLibrary[nfcKey]) {

        // Create folder uri in modidy format
        const playDirectory = 'local:directory:' + encodeURI(nfcLibrary[nfcKey])
        log('debug', playDirectory)

        // Get uris for all tracks in the folder
        const tracks = await mopidy.library.browse({ uri: playDirectory })
        const tracksUri = tracks.map(track => {
            return track.uri
        })
        log('debug', tracksUri)

        // Clear tracklist, replace with folder tracks, start playback
        await mopidy.tracklist.clear({})
        await mopidy.tracklist.add({ uris: tracksUri })
        await mopidy.playback.play()

        // Set activeNfc to current value
        state.activeNfc = nfcKey
        return
    }
})



//// REACT ON GPIO BUTTON EVENTS

gpioEvents.on('playPause', async () => {
    log('debug', 'playPause pushed')
    const mpdState = await mopidy.playback.getState()
    if (mpdState === 'playing') {
        mopidy.playback.pause()
        return
    }
    if (mpdState === 'paused') {
        mopidy.playback.resume()
        return
    }
    mopidy.playback.play()
})

gpioEvents.on('nextTrack', () => {
    log('debug', 'nextTrack pushed')
    mopidy.playback.next()
})

gpioEvents.on('previousTrack', () => {
    log('debug', 'previousTrack pushed')
    mopidy.playback.previous()
})

gpioEvents.on('volumeDown', async () => {
    try {
        log('debug', 'volumeDown pushed')
        const currentVolume = state.volume || await mopidy.mixer.getVolume({})
        const targetVolume = currentVolume - settings.volumeSteps
        const newVolume = targetVolume < settings.minVolume ? settings.minVolume : targetVolume
        log('debug', 'Setting to ', newVolume)
        mopidy.mixer.setVolume({ volume: newVolume })
        state.volume = newVolume
    } catch(err) {
        log('error', 'Could not set volume')
    }
})

gpioEvents.on('volumeUp', async () => {
    try {
        log('volumeUp pushed')
        const currentVolume = state.volume || await mopidy.mixer.getVolume({})
        const targetVolume = currentVolume + settings.volumeSteps
        const newVolume = targetVolume > settings.maxVolume ? maxVolume : targetVolume
        log('Setting to ', newVolume)
        mopidy.mixer.setVolume({ volume: newVolume })
        state.volume = newVolume
    } catch(err) {
        log('error', 'Could not set volume')
    }
})