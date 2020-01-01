const log = require('./log')
const state = require('./app-state')
const mopidy = require('./mopidy-connection')

// Toggle gpio and nfc music control lock
exports.lock = () => {
    log('debug', 'changing state.lock to ' + !state.log)
    state.lock = !state.lock
}

// Play all music files in the given directory (usually called by nfc event)
exports.playDirectory = async (path) => {

    // If homiebox is disconnected or in lock mode don't do anything
    if (state.lock || !state.connected) {
        return
    }
    // Create folder uri in modidy format
    const playDirectory = 'local:directory:' + encodeURI(path)
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
}

exports.playPause = async () => {

    // If homiebox is disconnected or in lock mode don't do anything
    if (state.lock || !state.connected) {
        return
    }

    // Start playback or pause if playing or resume if paused
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
}

exports.nextTrack = async () => {

    // If homiebox is disconnected or in lock mode don't do anything
    if (state.lock || !state.connected) {
        return
    }

    mopidy.playback.next()
}

exports.previousTrack = async () => {

    // If homiebox is disconnected or in lock mode don't do anything
    if (state.lock || !state.connected) {
        return
    }

    mopidy.playback.previous()
}

exports.changeVolume = async function (direction, step, minVolume, maxVolume) {
    if(state.lock) {
        return
    }
    try {
        log('debug', direction + ' volume pushed.')
        const currentVolume = await mopidy.mixer.getVolume({})
        log('debug', 'current: ' + currentVolume)
        log('debug', 'step: ' + step)
        let targetVolume 
        if (direction === 'increase') {
            targetVolume = Math.min(currentVolume + step, maxVolume)
        } else {
            targetVolume = Math.max(currentVolume - step, minVolume)
        }
        log('debug', 'target: ' + targetVolume)
        mopidy.mixer.setVolume({ volume: targetVolume })
    } catch (err) {
        log('error', 'Could not set volume')
        return
    }
}

