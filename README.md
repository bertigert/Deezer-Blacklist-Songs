# Deezer-Blacklist-Songs
Userscript/plugin for Deezer to blacklist songs from playing, not just from getting recommended.
Tested on Chrome w/ Violentmonkey.

Also supports the Desktop application thanks to [DeezMod](https://github.com/bertigert/DeezMod) (Download [here](https://github.com/bertigert/DeezMod/tree/main/plugins/blacklist_songs))

## Usage
Every song/artist which you told Deezer to not recommend anymore gets blacklisted from playing, unless specifically clicked.

Also adds a button to the player bar to blacklist the currently playing song locally.
![Unbenannt](https://github.com/user-attachments/assets/0b6f78b6-2046-489c-94c9-884782725652)

If you press this button, the currently playing track/artist will be added to a local blacklist and won't be added to the queue anymore, unless you directly play that song by clicking on it specifically. This can be useful if you don't want to influence the algorithm (e.g. in an album).

- Left-Click: Blacklist Song
- Right-Click: blacklist Artist

### Troubleshooting
If you for some reason cannot play a specific song, try removing it via the DevTools. The script exposes a global `blacklist_plugin` class which can be used to add/remove a specified or the currently playing song/artist to/from the blacklist.

### Note
The local blacklist is stored in the localstorage, so if that gets cleared, the local blacklist will be gone, the "don't recommend" blacklist will still work.


## Links
[GreazyFork](https://greasyfork.org/en/scripts/541034-deezer-blacklist-songs)

[GitHub](https://github.com/bertigert/Deezer-Blacklist-Songs)
