# homiebox
A music player controlled by nfc/rfid, e.g. for building a music box for children

## Motivation
My motivation was to build a music box for children that runs on a raspberry pi, uses rfid/nfc cards to start albums and gpio buttons to control playback. It is inspired by commercial projects such as toniebox and by open source projects such as [phoniebox](http://phoniebox.de)/[RPi-Jukebox-RFID](https://github.com/MiczFlor/RPi-Jukebox-RFID). It differs from commercial solutions by being free and open source, and from other open source projects by its rather simple javascript code structure.

## Architecture
Homiebox functions as a client to the python based music player deamon 'mopidy'. By default it assumes that mopidy is running on the same machine. It allows to control playback by an rfid/nfc reader and gpio buttons. On reading an rfid/nfc key, it plays tracks contained in a local folder. The code is structured as follows:
* _main.js_ handles the relation between a user input (rfid/nfc card or gpio button press) and playback functions.
* _control_ provides all main playback and system functions that are can be called by the user.
* _nfc-events.js_ returns an event emitter that triggers each time a rfid/nfc key is read.
* _gpio-events.js_ returns an event emitter that triggers each time gpio button is pressed.
* _nfc-music-library.json_ assigns nfc/rfid key values to folders that contain music. Folder names are relative to mopidy's file music library folder.
* _nfc-function-library.json_ assigns nfc/rfid key values to control functions, e.g. to control volume or play/pause with an nfc/rfid card.

## Customization
* I use homiebox with a neufftech rfid usb reader. It should be relatively easy to adapt this to other nfc/rfid readers by modifying nfc-events.js. I am happy to assist, please create a new issue with details on your reader.
* Currently, homiebox matches an rfid/nfc to a local folder and plays all files in that folder. Adding support for Spotify, Youtube or other services is not a big step using corresponding add-ins for mopidy.
* I currently use an nfs share to transfer music to homiebox and edit the matching between folders and cards. A web interface for uploading music and organizing the nfc/rfid library is planned.
* Remote playback control is possible by any MPD or Mopidy client. See mopidy docs for further information.
* The code could be adapted to use other music backends instead of mopidy by replacing the functions in *control.js*

