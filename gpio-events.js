
const events = require('events')
const Gpio = require('onoff').Gpio


const gpioActionsMap = require('./settings.json').gpio
const log = require('./log')

const gpioEvent = new events.EventEmitter()

let timer
let ignoreRelease = false

Object.keys(gpioActionsMap).forEach(gpioNumber => {
    const button = new Gpio(gpioNumber, 'in', 'both', { debounceTimeout: 10 })
    button.watch((error, value) => {
        if (value === 1) {
            // Emit gpio '_hold' event if button is pressed for 10 seconds
            if(gpioActionsMap[gpioNumber + '_hold']) {
                timer = setTimeout(() => {
                    log('debug', gpioNumber + ' pressed for more than 10 seconds.')
                    gpioEvent.emit(gpioActionsMap[gpioNumber + '_hold'])
                    ignoreRelease = true
                }, 10000)
            }
            return
        }

        if (value === 0) {
            // Reset timer on release
            if (timer) {
                clearTimeout(timer)
            }

            // Do not emit event if '_hold' event was emitted
            if (ignoreRelease) {
                return
            }
            gpioEvent.emit(gpioActionsMap[gpioNumber])
        }
    })
})

module.exports = gpioEvent