
const events = require('events')
const Gpio = require('onoff').Gpio


const gpioActionsMap = require('./settings.json').gpio


const gpioEvent = new events.EventEmitter()

Object.keys(gpioActionsMap).forEach(gpioNumber => {
    const button = new Gpio(gpioNumber, 'in', 'falling', { debounceTimeout: 10 })
    button.watch((error, value) => {
        if(error) {
            console.log(error)
        } else {
            gpioEvent.emit(gpioActionsMap[gpioNumber])
        }
    })
})

module.exports = gpioEvent