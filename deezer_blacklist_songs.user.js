// ==UserScript==
// @name        Deezer Blacklist Songs
// @description Blacklists songs from being played in deezer
// @author      bertigert
// @version     1.0.0
// @icon        https://www.google.com/s2/favicons?sz=64&domain=
// @namespace   Violentmonkey Scripts
// @match       https://www.deezer.com/*
// @grant       none
// ==/UserScript==


(function() {
    "use strict";
    class Logger {
            static LOG_VERY_MANY_THINGS_YES_YES = true; // set to false if you dont want the console getting spammed

            constructor() {
                this.log_textarea = null;
                this.PREFIXES = Object.freeze({
                    INFO: "?",
                    WARN: "⚠",
                    ERROR: "!",
                    SUCCESS: "*",
                    CONSOLE: "[Blacklist Songs]"
                });
                this.console = {
                    log: (...args) => console.log(this.PREFIXES.CONSOLE, ...args),
                    warn: (...args) => console.warn(this.PREFIXES.CONSOLE, ...args),
                    error: (...args) => console.error(this.PREFIXES.CONSOLE, ...args),
                    debug: (...args) => {if (Logger.LOG_VERY_MANY_THINGS_YES_YES) console.debug(this.PREFIXES.CONSOLE, ...args)}
                }
                // this.ui = {
                //     _log: (prefix, ...args) => {
                //         this.log_textarea.value += `[${prefix}] ${args.join(" ")}\n`;
                //         this.log_textarea.scrollTop = this.log_textarea.scrollHeight;
                //         this.console.debug(...args);
                //     },
                //     info: (...args) => this.ui._log(this.PREFIXES.INFO, ...args),
                //     warn: (...args) => this.ui._log(this.PREFIXES.WARN, ...args),
                //     error: (...args) => this.ui._log(this.PREFIXES.ERROR, ...args),
                //     success: (...args) => this.ui._log(this.PREFIXES.SUCCESS, ...args),
                //     clear: () => this.log_textarea.value = ""
                // }
            }
        }

        class Blacklist {
            static is_blacklisted(song_id) {
                return config.blacklisted_songs[song_id || dzPlayer.getSongId()] !== undefined;
            }

            static add_song(song_id) {
                song_id = parseInt(song_id) || dzPlayer.getSongId();
                if (this.is_blacklisted(song_id)) {
                    logger.console.warn(`Song ${song_id} is already blacklisted.`);
                    return false;
                }
                config.blacklisted_songs[song_id] = 1;
                logger.console.debug(`Added song ${song_id} to blacklist.`);
                return true;
            }
            static remove_song(song_id) {
                song_id = parseInt(song_id) || dzPlayer.getSongId();
                if (!this.is_blacklisted(song_id)) {
                    logger.console.warn(`Song with ID ${song_id} is not blacklisted.`);
                    return false;
                }
                delete config.blacklisted_songs[song_id];
                Config.static_save(config);
                logger.console.debug(`Removed song with ID ${song_id} from blacklist.`);
                return true;
            }
            // returns true if the song was blacklisted, false if it was unblacklisted, null if an error occurred
            static toggle_song(song_id) {
                song_id = parseInt(song_id) || dzPlayer.getSongId();
                if (this.is_blacklisted(song_id)) {
                    return this.remove_song(song_id) ? false : null;
                } else {
                    return this.add_song(song_id) ? true : null;
                }
            }
        }

        class Hooks {
            static HOOK_INDEXES = Object.freeze({
                SET_TRACKLIST: 0,
                ALL: 1
            });

            // we use this approach to unhook to avoid unhooking hooks created after our hooks
            static is_hooked = [false];

            static hook_set_tracklist() {
                const orig_set_tracklist = dzPlayer.setTrackList;
                dzPlayer.setTrackList = function (...args) {
                    if (!Hooks.is_hooked[Hooks.HOOK_INDEXES.SET_TRACKLIST]) return orig_set_tracklist.apply(this, args);
                    try {
                        let filtered_tracks = [];
                        const tracklist = args[0].data;
                        const orig_index = args[0].index;
                        for (let i = 0; i < tracklist.length; i++) {
                            const track = tracklist[i];
                            if (i === orig_index || !Blacklist.is_blacklisted(track.SNG_ID)) {
                                filtered_tracks.push(track);
                            } else {
                                // the tracklist is always the entire playlist/album and the index is the song the user clicked on,
                                // so if there is a blacklisted song before the current index, we need to adjust the index
                                if (i < orig_index) {
                                    args[0].index--;
                                }
                            }
                        }
                        args[0].data = filtered_tracks;

                        return orig_set_tracklist.apply(this, args);
                    } catch (error) {
                        logger.console.error("Error in setTrackList hook:", error);
                    }
                };
            }

            static toggle_hooks(enabled, ...args) {
                for (const arg of args) {
                    switch (arg) {
                        case Hooks.HOOK_INDEXES.ALL:
                            Hooks.is_hooked.fill(enabled);
                            return;
                        case Hooks.HOOK_INDEXES.SET_TRACKLIST:
                            Hooks.is_hooked[Hooks.HOOK_INDEXES.SET_TRACKLIST] = enabled;
                            break;
                    }
                }
            }
        }

        class UI {
            static create_ui() {
                let parent_div = document.querySelector("#page_player > div > div.chakra-button__group")
                if (parent_div) {
                    UI.create_css();
                    parent_div.prepend(UI.create_main_button());
                    logger.console.debug("UI created");
                } else {
                    logger.console.debug("Waiting for parent");
                    const observer = new MutationObserver(mutations => {
                        for (let mutation of mutations) {
                            if (mutation.type === 'childList') {
                                parent_div = document.querySelector("#page_player > div > div.chakra-button__group")
                                if (parent_div) {
                                    observer.disconnect();
                                    if (document.querySelector("button.blacklist_songs")) return;
                                    UI.create_css();
                                    parent_div.prepend(UI.create_main_button());
                                    logger.console.debug("UI created");
                                }
                            }
                        }
                    });
                    observer.observe(document.body, {childList: true, subtree: true});
                }
            }

            static create_main_button() {
                const button = document.createElement("button");
                button.title = "Click to (un-)blacklist the current song.";
                button.className = "blacklist_songs";
                button.innerHTML = `<svg viewBox="0 0 24 24" focusable="false">
                    <path fill-rule="evenodd"
                        d="M16 4.78v4.726l-.855-.252a14.771 14.771 0 0 0-4.182-.584c-.058 0-.116.002-.173.004a2.526 2.526 0 0 1-.123.004v7.986c0 2.142-1.193 3.336-3.334 3.336C5.193 20 4 18.806 4 16.665c0-2.142 1.193-3.336 3.333-3.336.806 0 1.476.17 2 .494V4.065l.629-.036c.33-.019.662-.029 1-.029a16.1 16.1 0 0 1 4.56.639l.478.14ZM5.333 16.664c0 1.403.598 2.002 2 2.002 1.402 0 2-.599 2-2.002 0-1.402-.598-2-2-2-1.402 0-2 .598-2 2Zm5.63-9.329c1.277 0 2.52.14 3.704.414V5.787a15.093 15.093 0 0 0-4-.45v2.001c.098-.002.197-.003.296-.003Z"
                        clip-rule="evenodd"></path>
                    <path fill-rule="evenodd"
                        d="M16.5 13a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Zm-2.17 3.5c0 .357.086.694.239.99l2.922-2.921a2.17 2.17 0 0 0-3.16 1.931Zm2.17 2.17a2.15 2.15 0 0 1-.99-.239l2.921-2.922a2.17 2.17 0 0 1-1.931 3.16Z"
                        clip-rule="evenodd"></path>
                </svg>`;

                document.querySelector("#page_player > div > div.chakra-button__group").prepend(button);

                button.onclick = () => {
                    const existing_popup = document.querySelector("span.blacklist_songs_popup");
                    if (existing_popup) existing_popup.remove();

                    const popup = UI.create_popup();
                    button.parentElement.appendChild(popup);

                    const is_blacklisted_now = Blacklist.toggle_song(dzPlayer.getSongId());
                    if (is_blacklisted_now === null) {
                        logger.console.error("An error occurred while toggling the blacklist status of the song.");
                        UI.show_popup(popup, "An error occurred while toggling the blacklist status of the song.", 2000, button.offsetLeft-button.clientWidth*1.25, button.offsetTop-button.clientHeight*1.25);
                        return;
                    }
                    if (is_blacklisted_now) {
                        dzPlayer.removeTracks(dzPlayer.getTrackListIndex());
                    }
                    this.show_popup(popup, is_blacklisted_now ? "Blacklisted song." : "Unblacklisted song.", 2000, button.offsetLeft-button.clientWidth*1.25, button.offsetTop-button.clientHeight*1.25);
                }
                return button;
            }

            static create_popup() {
                const popup = document.createElement("span");
                popup.className = "blacklist_songs_popup";
                return popup;
            }
            static show_popup(popup, text, duration=2000, x, y) {
                popup.textContent = text;
                popup.style.left = `${x}px`;
                popup.style.top = `${y}px`;
                popup.style.opacity = "1";
                popup.style.animation = "fadeIn 0.2s linear";
                setTimeout(() => {
                    UI.fade_out_popup(popup);
                }, duration);
            }
            static fade_out_popup(popup) {
                popup.style.opacity = "0";
                setTimeout(() => {
                    popup.remove();
                }, 500);
            }

            static create_css() {
                const css = `
                    .blacklist_songs_hidden {
                        display: none !important;
                    }

                    button.blacklist_songs {
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                        position: relative;
                        min-height: var(--tempo-sizes-size-m);
                        min-width: var(--tempo-sizes-size-m);
                        color: var(--tempo-colors-text-neutral-primary-default);
                        background: var(--tempo-colors-transparent);
                        border-radius: var(--tempo-radii-full);
                    }
                    button.blacklist_songs:hover {
                        background: var(--tempo-colors-background-neutral-tertiary-hovered);
                        color: var(--tempo-colors-text-neutral-primary-hovered);
                    }
                    button.blacklist_songs:active {
                        color: var(--tempo-colors-icon-accent-primary-default);
                    }
                    button.blacklist_songs > svg {
                        width: 24px;
                        height: 24px;
                        fill: currentcolor;
                    }

                    span.blacklist_songs_popup {
                        height: fit-content;
                        width: fit-content;
                        position: absolute;
                        padding: 5px;
                        color: var(--tempo-colors-text-neutral-secondary-default);
                        font-size: 12px;
                        background-color: var(--tempo-colors-background-neutral-secondary-default);
                        border-radius: var(--tempo-radii-lg);
                        box-shadow: rgba(0, 0, 0, 0.4) 0px 0px 25px 10px, rgba(0, 0, 0, 0.04) 0px 10px 10px -5px;
                        z-index: 9999;
                        transition: opacity 0.5s linear;
                    }
                    @keyframes fadeIn {
                        from { opacity: 0; }
                        to { opacity: 1; }
                    }
                    @keyframes fadeOut {
                        from { opacity: 1; }
                        to { opacity: 0; }
                    }
                `;
                const style = document.createElement("style");
                style.type = "text/css";
                style.textContent = css;
                document.querySelector("head").appendChild(style);
            }
        }

        class Config {
            static CURRENT_CONFIG_VERSION = 0;

            StringConfig = class {
                // functions to traverse and edit a json based on string paths
                static get_value(obj, path) {
                    return path.split(".").reduce((acc, key) => acc && acc[key], obj);
                }
                static set_key(obj, path, value) {
                    let current = obj;
                    const keys = path.split(".");
                    keys.slice(0, -1).forEach(key => {
                        current[key] = current[key] ?? (/^\d+$/.test(key) ? [] : {});
                        current = current[key];
                    });
                    current[keys[keys.length - 1]] = value;
                }
                static delete_key(obj, path) {
                    let current = obj;
                    const keys = path.split(".");
                    keys.slice(0, -1).forEach(key => {
                        if (!current[key]) return;
                        current = current[key];
                    });
                    delete current[keys[keys.length - 1]];
                }
                static move_key(obj, from, to) {
                    const value = this.get_value(obj, from);
                    if (value !== undefined) {
                        this.set_key(obj, to, value);
                        this.delete_key(obj, from);
                    }
                }
            }

            constructor() {
                this.config = this.setter_proxy(this.get());
            }

            retrieve() {
                return JSON.parse(localStorage.getItem("blacklist_songs_config")) || {
                    config_version: 0,
                    blacklisted_songs: {},
                };
            }

            get() {
                const config = this.retrieve();
                if (config.config_version !== Config.CURRENT_CONFIG_VERSION) {
                    return this.migrate_config(config);
                }
                return config;
            }

            save() {
                localStorage.setItem("blacklist_songs_config", JSON.stringify(this.config));
            }
            static static_save(config) {
                localStorage.setItem("blacklist_songs_config", JSON.stringify(config));
            }

            setter_proxy(obj) {
                return new Proxy(obj, {
                    set: (target, key, value) => {
                        target[key] = value;
                        this.save();
                        return true;
                    },
                    get: (target, key) => {
                        if (typeof target[key] === 'object' && target[key] !== null) {
                            return this.setter_proxy(target[key]); // Ensure nested objects are also proxied
                        }
                        return target[key];
                    }
                });
            }

            migrate_config(config) {
                // patch structure
                // [from, to, ?value]
                    // if both "from" and "to" exist, we change the path from "from" to "to"
                    // if "from" is null, "value" is required as we create/update the key and set the value to "value"
                    // if "to" is null, we delete the key
                const patches = [
                ]

                const old_cfg_version = config.config_version === undefined ? -1 : config.config_version;
                for (let patch = old_cfg_version+1; patch <= Config.CURRENT_CONFIG_VERSION; patch++) {
                    if (patch !== 0) { // we add the config_version key in the first patch
                        config.config_version++;
                    }
                    patches[patch].forEach(([from, to, value]) => {
                        if (from && to) {
                            this.StringConfig.move_key(config, from, to);
                        }
                        else if (!from && to) {
                            this.StringConfig.set_key(config, to, value);
                        }
                        else if (from && !to) {
                            this.StringConfig.delete_key(config, from);
                        }
                    });
                    logger.console.debug("Migrated to version", patch);
                }
                logger.console.log("Migrated config to version", Config.CURRENT_CONFIG_VERSION);
                return config;
            }
        }

        const logger = new Logger();
        logger.console.debug("Creating All Class Instances");
        const config = new Config().config;

        (async function main() {
            UI.create_ui();
            window.blacklist_plugin = Blacklist

            logger.console.log("Hooking dzplayer.setTrackList");
            const wait_for_dz_player_interval = setInterval(() => {
                if (window.dzPlayer) {
                    clearInterval(wait_for_dz_player_interval);
                    Hooks.toggle_hooks(true, Hooks.HOOK_INDEXES.ALL);
                    Hooks.hook_set_tracklist();
                }
            }, 100);
        })();
})();
