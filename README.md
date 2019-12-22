# homiebox
A music player controlled by nfc/rfid, e.g. for building a music box for children

## Motivation
My motivation was to create a music box for children that runs on a raspberry pi, uses nfc cards to start albums and gpio buttons to control playback. It is inspired by commercial projects such as toniebox and by open source projects such as [phoniebox](http://phoniebox.de)/[RPi-Jukebox-RFID](https://github.com/MiczFlor/RPi-Jukebox-RFID). It differs from commercial solutions by being free and open source, and from the mentioned open source projects by maintaining a simple code structure fully based on nodejs.

## Architecture
Homiebox functions as a client to the python based music player deamon 'mopidy'. By default it assumes that mopidy is running on the same machine. It allows to control playback by an rfid/nfc reader and gpio buttons. On reading an rfid/nfc key, it plays tracks contained in a local folder. The codebase is structured as follows:
* _main.js_ controls the music playback. It reacts on various events that can be triggered by rfid/nfc keys or gpio buttons.
* _nfc-events.js_ returns an event emitter that triggers an event each time a rfid/nfc key is read. It currently only supports the Neufftech usb rfid reader, but I am happy to assist adapting it to other readers. Please create a new issue with details on your reader.
* _gpio-events.js_ returns an event emitter that triggers an event each time gpio button is pressed. Which button triggers which event can be set up in settings.json.
* _settings.json_ contains all configuration settings.
* _nfc-library.json_ contains an object matching nfc/rfid key values (properties) to folder names (values). Folder names are relative to mopidy's local music library folder.

## Customization
* I have only tested homiebox with a neufftech rfid usb reader. It should be relatively easy to adapt this to other readers by modifying nfc-events.js.
* Currently, homiebox matches an rfid/nfc to a local folder and plays all files in that folder. Adding support for Spotify, Youtube or other services is not a big step given that corresponding add-ins for mopidy exist.
* A web service for uploading music and organizing the nfc/rfid library is planned.
