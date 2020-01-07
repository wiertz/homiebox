const events = require('events')
const Gpio = require('onoff').Gpio


const gpioActionsMap = require('./settings.json').gpio


const gpioEvent = new events.EventEmitter()
let timer

Object.keys(gpioActionsMap).forEach(gpioNumber => {
    let ignoreNext = false
    const button = new Gpio(gpioNumber, 'in', 'both', { debounceTimeout: 10 })
    button.watch((error, value) => {

        // Ignore event immediately after 'hold' event was emitted
        if (ignoreNext) {
            ignoreNext = false
            return
        }

        if (value === 1) {
            // Emit button 'hold' event if pressed for 5 seconds
            if (gpioActionsMap[gpioNumber].hold) {
                timer = setTimeout(() => {
                    gpioEvent.emit(gpioActionsMap[gpioNumber].hold)
                    ignoreNext = true
                }, 5000)
            }
            return
        }

        if (value === 0) {
            // Reset timer on release
            if (timer) {
                clearTimeout(timer)
            }

            // Emit 'push' event for button
            if (gpioActionsMap[gpioNumber].push) {
                gpioEvent.emit(gpioActionsMap[gpioNumber].push)
            }
        }
    })
})

module.exports = gpioEvent