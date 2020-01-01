const Mopidy = require('mopidy')

const log = require('./log')
const settings = require('./settings.json')
const state = require('./app-state')


// Connect to mopidy server
const mopidy = new Mopidy({
    webSocketUrl: settings.mopidyWebSocketUrl,
    callingConvention: "by-position-or-by-name"
})

mopidy.on('state:online', async () => {
    //log('info', 'Connected to mopidy')
    state.connected = true

    // Refresh library once on startup
    mopidy.library.refresh({ "uri": null })

    // Set volume
    mopidy.mixer.setVolume({ volume: (settings.startupVolume || 50) })

    // Log list of current directories (info/debugging)
    const dirs = await mopidy.library.browse({ uri: 'local:directory' })
    log('debug', dirs)
})

mopidy.on('state:offline', async () => {
    state.connected = false
    log('info', 'Lost connection to mopidy')
})

module.exports = mopidy