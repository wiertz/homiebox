const fs = require('fs')
const Mopidy = require('mopidy')


//// DO THINGS AT STARTUP

// Read logging utility function.
const log = require('./log')

const settings = require('./settings.json')

// Read pairs of directories and nfc ids.
const nfcLibrary = require(settings.nfcLibrary)
const nfcFunctions = require('./nfc-functions')

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

// Import state of homiebox.
// 'state.activeNfc' contains the last nfc id that was played.
// 'state.lock' disables buttons and nfc cards
const state = require('./app-state.js')

// Listen to mopidy events, set homiebox state accordingly, 
// and log events to console (info/debugging)
mopidy.on('state:online', async () => {
    // Refresh library once on startup
    mopidy.library.refresh({ "uri": null })
    state.volume = settings.startupVolume || 10
    mopidy.mixer.setVolume({ volume: state.volume })
    // Log list of current directories (info/debugging)
    const dirs = await mopidy.library.browse({ uri: 'local:directory' })
    log('debug', dirs)
})


//// REACT ON NFC CARD HAVING BEEN READ

nfcEvents.on('nfcRead', async nfcKey => {

    log('info', 'NFC key:' + nfcKey)

    // If the nfc id has a matching function,
    // call execute this function
    if (nfcFunctions[nfcKey]) {
        log('debug', 'Executing function linked to key')
        nfcFunctions[nfcKey]()
        return
    }
    
    if(state.lock) {
        return
    }

    // If the nfc id has a matching music folder,
    // play the folder linked to this nfc id
    if (nfcLibrary[nfcKey]) {

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
    if(state.lock) {
        return
    }
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
    if(state.lock) {
        return
    }
    log('debug', 'nextTrack pushed')
    mopidy.playback.next()
})

gpioEvents.on('previousTrack', () => {
    if(state.lock) {
        return
    }
    log('debug', 'previousTrack pushed')
    mopidy.playback.previous()
})


_changeVolume = async function (direction) {
    if(state.lock) {
        return
    }
    try {
        log('debug', direction + ' volume pushed.')
        const currentVolume = await mopidy.mixer.getVolume({})
        let targetVolume 
        if (direction === 'increase') {
            targetVolume = Math.min(currentVolume + settings.volumeSteps, settings.maxVolume)
        } else {
            targetVolume = Math.max(currentVolume - settings.volumeSteps, settings.minVolume)
        }
        log('debug', 'Setting to ' + targetVolume)
        mopidy.mixer.setVolume({ volume: targetVolume })
    } catch (err) {
        log('error', 'Could not set volume')
        return
    }
}

gpioEvents.on('volumeDown', () => {
    _changeVolume('decrease')
})

gpioEvents.on('volumeUp', () => {
    _changeVolume('increase')
})