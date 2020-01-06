
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

            // Emit button 'hold' event if pressed for 10 seconds
            if(gpioActionsMap[gpioNumber].hold) {
                timer = setTimeout(() => {
                    gpioEvent.emit(gpioActionsMap[gpioNumber].hold)
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

            // Do not emit event if 'hold' event was emitted
            if (ignoreRelease) {
                ignoreRelease = false
                return
            }

            // Emit 'push' event for button
            if(gpioActionsMap[gpioNumber].push) {
                gpioEvent.emit(gpioActionsMap[gpioNumber].push)
            }
        }
    })
})

module.exports = gpioEvent