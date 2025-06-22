# Deezer-Blacklist-Songs
Userscript/plugin for Deezer to blacklist songs from playing, not just from getting recommended.

### Usage
Adds a button to the player bar to blacklist the currently playing song.
![Unbenannt](https://github.com/user-attachments/assets/0b6f78b6-2046-489c-94c9-884782725652)

If you press this button, the currently playing track will be skipped (unless it is the only one in the queue) and will not be added to the queue anymore, unless you directly play that song by clicking on it specifically.

### Troubleshooting
If you for some reason cannot play a specific song, try removing it via the DevTools. The script exposes a global `blacklist_plugin` class which can be used to add/remove a specified or the currently playing song to/from the blacklist.

### Note
The blacklist is stored in the localstorage, so if that gets cleared, the blacklist will be gone.
