
const events = require('events')
const Gpio = require('onoff').Gpio


const gpioActionsMap = require('./settings.json').gpio


const gpioEvent = new events.EventEmitter()

let timer
let holdEventEmitted = false

Object.keys(gpioActionsMap).forEach(gpioNumber => {
    const button = new Gpio(gpioNumber, 'in', 'both', { debounceTimeout: 10 })
    button.watch((error, value) => {
        if (value === 1) {

            // If button is pressed for 10 seconds or more
            timer = setTimeout(() => {
                gpioEvent.emit(gpioActionsMap[gpioNumber + '_hold'])
                holdEventEmitted = true
            }, 10000)
            return
        }
        
        if (value === 0) {
            clearTimeout(timer)

            // If button is released and was not pressed for more than 10 seconds
            if (!holdEventEmitted) {
                gpioEvent.emit(gpioActionsMap[gpioNumber])
            }
            return
        }
    })
})

module.exports = gpioEvent