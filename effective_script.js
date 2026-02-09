"use worker;";

// --- Polyfills ---
// Simple Base64 polyfill for environments where btoa/atob might be missing
const base64 = {
    chars: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
    encode: function (input) {
        let str = String(input);
        let output = "";
        for (let block, charCode, idx = 0, map = base64.chars;
            str.charAt(idx | 0) || (map = "=", idx % 1);
            output += map.charAt(63 & block >> 8 - idx % 1 * 8)) {
            charCode = str.charCodeAt(idx += 3 / 4);
            if (charCode > 0xFF) {
                throw new Error("'base64.encode' failed: The string to be encoded contains characters outside of the Latin1 range.");
            }
            block = block << 8 | charCode;
        }
        return output;
    },
    decode: function (input) {
        let str = String(input).replace(/[=]+$/, "");
        if (str.length % 4 == 1) {
            throw new Error("'base64.decode' failed: The string to be decoded is not correctly encoded.");
        }
        let output = "";
        for (let bc = 0, bs, buffer, idx = 0;
            buffer = str.charAt(idx++);
            ~buffer && (bs = bc % 4 ? bs * 64 + bc : bc,
                bc++ % 4) ? output += String.fromCharCode(255 & bs >> (-2 * bc & 6)) : 0) {
            buffer = base64.chars.indexOf(buffer);
        }
        return output;
    }
};

const _btoa = typeof btoa === 'function' ? btoa : base64.encode;
const _atob = typeof atob === 'function' ? atob : base64.decode;

// --- Configuration ---
// These will be injected by the builder
const CONFIG = {
    secretKey: "MySecretKey123",
    defaultState: {
  "inventory": [],
  "stats": {
    "charm": 10,
    "intelligence": 10,
    "strength": 10
  },
  "current_side_effects": [],
  "current_time": "2025-06-01T12:00:00Z",
  "turn_count": 0
}
};

// --- Utilities ---

const XORCipher = {
    encrypt: function (text, key) {
        try {
            let result = "";
            for (let i = 0; i < text.length; i++) {
                result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
            }
            return _btoa(result);
        } catch (e) {
            console.error("Encryption failed:", e);
            return "";
        }
    },
    decrypt: function (text, key) {
        try {
            let decoded = _atob(text);
            let result = "";
            for (let i = 0; i < decoded.length; i++) {
                result += String.fromCharCode(decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length));
            }
            return result;
        } catch (e) {
            console.error("Decryption failed:", e);
            return null;
        }
    }
};

const TimeManager = {
    addDuration: function (isoTime, durationStr) {
        const date = new Date(isoTime);
        const regex = /P(?:(\d+)D)?T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
        const matches = durationStr.match(regex);

        if (matches) {
            const days = parseInt(matches[1] || 0);
            const hours = parseInt(matches[2] || 0);
            const minutes = parseInt(matches[3] || 0);
            const seconds = parseInt(matches[4] || 0);

            date.setDate(date.getDate() + days);
            date.setHours(date.getHours() + hours);
            date.setMinutes(date.getMinutes() + minutes);
            date.setSeconds(date.getSeconds() + seconds);
        }
        const iso = date.toISOString();
        return iso.split('.')[0] + "Z";
    },
    isExpired: function (expiryIso, currentIso) {
        return new Date(expiryIso) <= new Date(currentIso);
    }
};

// --- Core Logic ---

function createGameState(initialState) {
    const data = JSON.parse(JSON.stringify(initialState));

    return {
        data: data,
        updateTime: function (elapsedDuration) {
            if (elapsedDuration) {
                this.data.current_time = TimeManager.addDuration(this.data.current_time, elapsedDuration);
            }
        },
        applySideEffect: function (effect) {
            const expiry = TimeManager.addDuration(this.data.current_time, effect.duration || "PT0M");

            for (const stat in effect.impacts) {
                if (this.data.stats[stat] !== undefined) {
                    this.data.stats[stat] += effect.impacts[stat];
                }
            }

            const effectCopy = {};
            for (const key in effect) {
                effectCopy[key] = effect[key];
            }
            effectCopy.expiry = expiry;

            this.data.current_side_effects.push(effectCopy);
            this.data.current_side_effects.sort(function (a, b) {
                return new Date(a.expiry) - new Date(b.expiry);
            });
        },
        revertExpiredEffects: function () {
            const activeEffects = [];
            const revertedLog = [];

            for (let i = 0; i < this.data.current_side_effects.length; i++) {
                const effect = this.data.current_side_effects[i];
                if (TimeManager.isExpired(effect.expiry, this.data.current_time)) {
                    for (const stat in effect.impacts) {
                        if (this.data.stats[stat] !== undefined) {
                            this.data.stats[stat] -= effect.impacts[stat];
                        }
                    }
                    revertedLog.push("Effect expired: " + effect.what);
                } else {
                    activeEffects.push(effect);
                }
            }
            this.data.current_side_effects = activeEffects;
            return revertedLog;
        }
    };
}

// Injected Functions wrapper
const UserLogic = {
    updateState: function (state, summary) {
        if (summary.elapsed_duration) {
            state.updateTime(summary.elapsed_duration);
        }

        // Example custom logic:
        // if (summary.gained_item) state.data.inventory.push(summary.gained_item);
    },
    generateWhatHappen: function (state) {
        let text = "Current Time: " + state.data.current_time + "\\n";

        text += "Active Effects:\\n";
        if (state.data.current_side_effects.length === 0) {
            text += "- None\\n";
        } else {
            for (let i = 0; i < state.data.current_side_effects.length; i++) {
                const effect = state.data.current_side_effects[i];
                text += "- " + effect.what + " (Expires: " + effect.expiry + ")\\n";
            }
        }

        text += "Current Stats: " + JSON.stringify(state.data.stats);
        return text;
    }
};

function processScript(context) {
    function ensureContext() {
        if (!context.character) context.character = {};
        if (!context.character.scenario) context.character.scenario = "";
        if (typeof context.character.scenario !== 'string') context.character.scenario = "";
        if (!context.character.personality) context.character.personality = "";
    }

    function parseLastMessage() {
        if (!context.chat || !context.chat.messages || context.chat.messages.length === 0) {
            return null;
        }
        const lastMsg = context.chat.messages[context.chat.messages.length - 1].message;

        const secretMatch = lastMsg.match(/\[SCRIPT_SECRET\]([\s\S]*?)\[\/SCRIPT_SECRET\]/);
        let secretData = null;
        if (secretMatch) {
            const decrypted = XORCipher.decrypt(secretMatch[1], CONFIG.secretKey);
            if (decrypted) {
                try {
                    secretData = JSON.parse(decrypted);
                } catch (e) {
                    console.error("Failed to parse secret JSON", e);
                }
            }
        }

        const summaryMatch = lastMsg.match(/\[TURN_SUMMARY\]([\s\S]*?)\[\/TURN_SUMMARY\]/);
        let summaryData = null;
        if (summaryMatch) {
            try {
                summaryData = JSON.parse(summaryMatch[1]);
            } catch (e) {
                console.error("Failed to parse summary JSON", e);
            }
        }

        return { secretData: secretData, summaryData: summaryData };
    }

    ensureContext();

    const result = parseLastMessage() || {};
    const state = createGameState(result.secretData || CONFIG.defaultState);
    state.data.turn_count++;

    let eventsLog = [];

    if (result.summaryData) {
        // Run User Logic for generic updates (e.g. inventory)
        UserLogic.updateState(state, result.summaryData);

        // Core logic for effects
        const reverted = state.revertExpiredEffects();
        eventsLog = eventsLog.concat(reverted);

        if (result.summaryData.side_effect && Array.isArray(result.summaryData.side_effect)) {
            for (let i = 0; i < result.summaryData.side_effect.length; i++) {
                const effect = result.summaryData.side_effect[i];
                state.applySideEffect(effect);
                eventsLog.push("Effect applied: " + effect.what);
            }
        }
    }

    const nextSecret = XORCipher.encrypt(JSON.stringify(state.data), CONFIG.secretKey);

    const whatHappen = UserLogic.generateWhatHappen(state);

    const injection = "\n\n[SYSTEM INSTRUCTION]\nThe previous turn summary and state have been processed.\nYou must adhere to the following constraints for the upcoming turn:\n\n[WHAT_HAPPEN]\n" + whatHappen + "\n[/WHAT_HAPPEN]\n\nREQUIREMENTS:\n1.  At the end of your response, you MUST include a [TURN_SUMMARY]...[/TURN_SUMMARY] JSON block.\n    -   Include \"elapsed_duration\" (e.g., \"PT5M\" for 5 minutes).\n    -   Include \"side_effect\" array if significant events occur (e.g., [{\"what\": \"drank potion\", \"impacts\": {\"charm\": 5}, \"duration\": \"PT1H\"}]).\n2.  You MUST start your response with the following encrypted state block exactly as is:\n    [SCRIPT_SECRET]" + nextSecret + "[/SCRIPT_SECRET]\n";

    context.character.scenario += injection;
}

if (typeof context !== 'undefined') {
    processScript(context);
}
