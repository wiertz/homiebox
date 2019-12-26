const state = require('app-state')
const log = require('./log')

module.exports = {
    '0007935219': function() {
        log('debug', 'changing state.lock to ' + !state.log)
        state.lock = !state.lock
    }
}