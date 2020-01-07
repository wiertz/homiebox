const exec = require('child_process').exec;


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
    const playDirectory = 'file:///music/' + encodeURI(path)
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
    if (state.lock || !state.connected) {
        return
    }
    try {
        log('debug', direction + ' volume pushed.')
        const currentVolume = await mopidy.mixer.getVolume({})
        log('debug', 'current: ' + currentVolume)
        log('debug', 'step: ' + step)
        let targetVolume
        if (direction === 'increase') {
            // the api setter and getter behave inconsistently, at least for the alsamixerhence 
            targetVolume = Math.min(currentVolume + step + 1, maxVolume)
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

const _stopSleepTimer = async function() {
    if (state.sleepTimer) {
        clearInterval(state.sleepTimer)
        state.sleepTimer = null
        log('info', 'Sleep timer stopped.')
        return
    }
}

exports.sleepTimer = async function (duration) {
    try {
        if (state.lock) {
            return
        }

        // If sleep timer is active, stop
        if (state.sleepTimer) {
            _stopSleepTimer()
            return
        }

        log('info', 'Sleep timer ' + duration + ' minutes.')
        startVolume = await mopidy.mixer.getVolume({})
        // At each time interval (in ms), volume will be reduced by 1
        timeInterval = Math.round(duration * 60000 / startVolume)
        let counter = 0
        state.sleepTimer = setInterval(async () => {
            counter += 1
            newVolume = startVolume - counter * 1
            log('debug', 'Sleep timer: reducing volume to ' + newVolume)
            mopidy.mixer.setVolume({ volume: newVolume })
            if(newVolume === 0) {
                await mopidy.playback.stop()
                mopidy.mixer.setVolume({ volume: startVolume })
                _stopSleepTimer()
                log('info', 'Sleep timer ended.')
            }
        }, timeInterval)
    } catch (err) {
        log('error', err)
        _stopSleepTimer()
        return
    }
}

exports.stop = async function () {
    mopidy.playback.stop()
}

exports.shutdown = () => {
    exec('sudo shutdown now')
}