const settings = require('./settings.json')

const logMessage = function(type, message) {
    if(settings.log[type] === true) {
        console.log(type.toUpperCase(), ' ', message)
    }
}

module.exports = logMessage