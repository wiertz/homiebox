const Mopidy = require('mopidy')

const log = require('./log')
const settings = require('./settings.json')
const state = require('./app-state')


// Connect to mopidy server
let mopidy
try {
    mopidy = new Mopidy({
        webSocketUrl: settings.mopidyWebSocketUrl,
        callingConvention: "by-position-or-by-name",
        autoConnect: false
    })
} catch (err) {
    console.log(err.code)
}

mopidy.on('state:online', async () => {
    //log('info', 'Connected to mopidy')
    state.connected = true

    // Refresh library once on startup
    mopidy.library.refresh({ "uri": null })

    // Set volume
    mopidy.mixer.setVolume({ volume: (settings.volume.startup || 50) })

    // Log list of current directories (info/debugging)
    const dirs = await mopidy.library.browse({ uri: 'local:directory' })
    log('debug', dirs)
})

mopidy.on('state:offline', async () => {
    state.connected = false
    log('info', 'Lost connection to mopidy')
})

try {
    mopidy.connect()
} catch (err) {
    console.log(err.code)
}


module.exports = mopidy