const logSettings = require('./settings.json').log

const logMessage = function(type, message) {
    if(logSettings.type) {
        console.log(type.toUpperCase(), ' ', message)
    }
}

module.exports = logMessage