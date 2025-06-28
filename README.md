# Deezer-Blacklist-Songs
Userscript/plugin for Deezer to blacklist songs from playing, not just from getting recommended.

### Usage
Every song/artist which you told Deezer to not recommend anymore gets blacklisted from playing, unless specifically clicked. Useful for albums.

Also adds a button to the player bar to blacklist the currently playing song locally.
![Unbenannt](https://github.com/user-attachments/assets/0b6f78b6-2046-489c-94c9-884782725652)

If you press this button, the currently playing track will be added to a local blacklist and won't be added to the queue anymore, unless you directly play that song by clicking on it specifically.

### Troubleshooting
If you for some reason cannot play a specific song, try removing it via the DevTools. The script exposes a global `blacklist_plugin` class which can be used to add/remove a specified or the currently playing song/artist to/from the blacklist.

### Note
The local blacklist is stored in the localstorage, so if that gets cleared, the local blacklist will be gone, the "don't recommend" blacklist will still work.


## Links
[GreazyFork](https://greasyfork.org/en/scripts/541034-deezer-blacklist-songs)

[GitHub](https://github.com/bertigert/Deezer-Blacklist-Songs)
