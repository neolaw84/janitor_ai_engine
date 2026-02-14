// --- utils/base64.js ---
const Base64 = {
    _keyStr: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",

    // Public method for encoding text to Base64
    encodeRaw: function (input) {
        let output = "";
        let chr1, chr2, chr3, enc1, enc2, enc3, enc4;
        let i = 0;

        input = Base64._utf8_encode(input);

        while (i < input.length) {
            chr1 = input.charCodeAt(i++);
            chr2 = input.charCodeAt(i++);
            chr3 = input.charCodeAt(i++);

            enc1 = chr1 >> 2;
            enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
            enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
            enc4 = chr3 & 63;

            if (isNaN(chr2)) {
                enc3 = enc4 = 64;
            } else if (isNaN(chr3)) {
                enc4 = 64;
            }

            output = output +
                this._keyStr.charAt(enc1) + this._keyStr.charAt(enc2) +
                this._keyStr.charAt(enc3) + this._keyStr.charAt(enc4);
        }

        return output;
    },

    // Public method for decoding Base64 to text
    decodeRaw: function (input) {
        let output = "";
        let chr1, chr2, chr3;
        let enc1, enc2, enc3, enc4;
        let i = 0;

        input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

        while (i < input.length) {
            enc1 = this._keyStr.indexOf(input.charAt(i++));
            enc2 = this._keyStr.indexOf(input.charAt(i++));
            enc3 = this._keyStr.indexOf(input.charAt(i++));
            enc4 = this._keyStr.indexOf(input.charAt(i++));

            chr1 = (enc1 << 2) | (enc2 >> 4);
            chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
            chr3 = ((enc3 & 3) << 6) | enc4;

            output = output + String.fromCharCode(chr1);

            if (enc3 != 64) {
                output = output + String.fromCharCode(chr2);
            }
            if (enc4 != 64) {
                output = output + String.fromCharCode(chr3);
            }
        }

        output = Base64._utf8_decode(output);
        return output;
    },



    _utf8_encode: function (string) {
        string = string.replace(/\r\n/g, "\n");
        let utftext = "";

        for (let n = 0; n < string.length; n++) {
            let c = string.charCodeAt(n);

            if (c < 128) {
                utftext += String.fromCharCode(c);
            } else if ((c > 127) && (c < 2048)) {
                utftext += String.fromCharCode((c >> 6) | 192);
                utftext += String.fromCharCode((c & 63) | 128);
            } else {
                utftext += String.fromCharCode((c >> 12) | 224);
                utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                utftext += String.fromCharCode((c & 63) | 128);
            }
        }

        return utftext;
    },

    _utf8_decode: function (utftext) {
        let string = "";
        let i = 0;
        let c = 0;
        let c1 = 0;
        let c2 = 0;
        let c3 = 0;

        while (i < utftext.length) {
            c = utftext.charCodeAt(i);

            if (c < 128) {
                string += String.fromCharCode(c);
                i++;
            } else if ((c > 191) && (c < 224)) {
                c2 = utftext.charCodeAt(i + 1);
                string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
                i += 2;
            } else {
                c2 = utftext.charCodeAt(i + 1);
                c3 = utftext.charCodeAt(i + 2);
                string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
                i += 3;
            }
        }
        return string;
    }
};





// --- utils/xor_cipher.js ---
const XORCipher = {


    decode: function (key, input) {
        let output = "";
        for (let i = 0; i < input.length; i++) {
            const c = input.charCodeAt(i) ^ key.charCodeAt(i % key.length);
            output += String.fromCharCode(c);
        }
        return output;
    }
};





// --- utils/time_utils.js ---
const TimeUtils = {
    parseDuration: function (durationStr) {
        const regex = /P(?:([0-9]+)Y)?(?:([0-9]+)M)?(?:([0-9]+)W)?(?:([0-9]+)D)?(?:T(?:([0-9]+)H)?(?:([0-9]+)M)?(?:([0-9]+)S)?)?/;
        const matches = durationStr.match(regex);

        if (!matches) return 0;

        const years = parseInt(matches[1] || 0);
        const months = parseInt(matches[2] || 0);
        const weeks = parseInt(matches[3] || 0);
        const days = parseInt(matches[4] || 0);
        const hours = parseInt(matches[5] || 0);
        const minutes = parseInt(matches[6] || 0);
        const seconds = parseInt(matches[7] || 0);

        let ms = 0;
        ms += seconds * 1000;
        ms += minutes * 60 * 1000;
        ms += hours * 60 * 60 * 1000;
        ms += days * 24 * 60 * 60 * 1000;
        ms += weeks * 7 * 24 * 60 * 60 * 1000;
        ms += months * 30 * 24 * 60 * 60 * 1000;
        ms += years * 365 * 24 * 60 * 60 * 1000;

        return ms;
    },

    addDuration: function (dateStr, duration) {
        const date = new Date(dateStr);
        let msToAdd = 0;

        if (typeof duration === 'string') {
            msToAdd = this.parseDuration(duration);
        } else {
            msToAdd = duration;
        }

        const newTime = date.getTime() + msToAdd;
        return new Date(newTime).toISOString().split('.')[0];
    },

    isPast: function (dateStr, referenceDateStr) {
        const date = new Date(dateStr);
        const refDate = new Date(referenceDateStr);
        return date < refDate;
    },

    // Check if valid "yyyy-mm-ddTHH:MM:SS" format
    isValidDateStr: function (dateStr) {
        const regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/;
        if (!regex.test(dateStr)) return false;
        const date = new Date(dateStr);
        return !isNaN(date.getTime());
    },

    // Format Date object to "yyyy-mm-ddTHH:MM:SS"
    formatDate: function (date) {
        const pad = function (num) { return (num < 10 ? '0' : '') + num; };
        return date.getFullYear() +
            '-' + pad(date.getMonth() + 1) +
            '-' + pad(date.getDate()) +
            'T' + pad(date.getHours()) +
            ':' + pad(date.getMinutes()) +
            ':' + pad(date.getSeconds());
    }
};





// --- utils/rng_utils.js ---
const RPMGL_RNG = {
    // Basic wrapper for Math.random
    random: function () {
        return Math.random();
    },

    // Random integer between min and max (inclusive)
    randomInt: function (min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    // Parse dice string "xdy" or "xdy+z" (e.g. "3d6", "1d20+5")
    roll: function (diceStr) {
        if (!diceStr) diceStr = "3d6";

        const parts = diceStr.toLowerCase().split('d');
        if (parts.length !== 2) return 0;

        const count = parseInt(parts[0]);
        const sidesPart = parts[1];
        let sides = 0;
        let modifier = 0;

        if (sidesPart.indexOf('+') !== -1) {
            const modParts = sidesPart.split('+');
            sides = parseInt(modParts[0]);
            modifier = parseInt(modParts[1]);
        } else if (sidesPart.indexOf('-') !== -1) {
            const modParts = sidesPart.split('-');
            sides = parseInt(modParts[0]);
            modifier = -parseInt(modParts[1]);
        } else {
            sides = parseInt(sidesPart);
        }

        if (isNaN(count) || isNaN(sides)) return 0;

        let total = 0;
        for (let i = 0; i < count; i++) {
            total += this.randomInt(1, sides);
        }

        return total + modifier;
    },

    // Roll X dice with Y sides each
    rollxdy: function (x, y) {
        if (typeof x === 'undefined') x = 3;
        if (typeof y === 'undefined') y = 6;

        let total = 0;
        for (let i = 0; i < x; i++) {
            total += this.randomInt(1, y);
        }
        return total;
    }
};





// --- utils/llm_utils.js ---
const LLMUtils = {
    // Parse LLM input string to object
    parseInput: function (input) {
        if (typeof input === 'object' && input !== null) return input;
        try {
            return JSON.parse(input);
        } catch (e) {
            return { error: "Failed to parse JSON", raw: input };
        }
    },

    // Validate input recursively and return a mirror object indicating validity
    cleanInput: function (inputObject) {
        const result = {};

        // 1. Validate elapsed_time
        if (typeof inputObject.elapsed_time === 'string' && inputObject.elapsed_time.indexOf('P') === 0) {
            result.elapsed_time = true;
        } else {
            result.elapsed_time = false;
        }

        // 2. Validate effects
        if (Array.isArray(inputObject.effects)) {
            result.effects = [];
            for (let i = 0; i < inputObject.effects.length; i++) {
                const eff = inputObject.effects[i];
                const resEff = {};

                // Key
                resEff.key = (typeof eff.key === 'string' && eff.key.length > 0);

                // What
                resEff.what = (typeof eff.what === 'string');

                // Temp
                resEff.temp = (typeof eff.temp === 'boolean');

                // When
                // Using TimeUtils.isValidDateStr if available in scope (it is in our build)
                resEff.when = (typeof eff.when === 'string' && TimeUtils.isValidDateStr(eff.when));

                // Duration
                resEff.duration = (typeof eff.duration === 'string' && eff.duration.indexOf('P') === 0);

                // Impacts
                if (Array.isArray(eff.impacts)) {
                    resEff.impacts = [];
                    for (let j = 0; j < eff.impacts.length; j++) {
                        const imp = eff.impacts[j];
                        const resImp = {};

                        // Stats
                        resImp.stats = (typeof imp.stats === 'string');

                        // Op
                        resImp.op = (['set', 'add', 'sub'].indexOf(imp.op) !== -1);

                        // Value
                        resImp.value = (typeof imp.value === 'number');

                        resEff.impacts.push(resImp);
                    }
                } else {
                    resEff.impacts = false;
                }

                result.effects.push(resEff);
            }
        } else {
            result.effects = false;
        }

        // 3. Debug
        if (inputObject.debug) {
            result.debug = true;
        }

        return result;
    },

    // Return instruction block with encrypted state
    encodeState: function (characterSheet, key) {
        if (!characterSheet || !key) return "";
        const jsonStr = JSON.stringify(characterSheet);
        const encrypted = XORCipher.decode(key, jsonStr);
        const b64 = Base64.encodeRaw(encrypted);
        return `Return the following block verbatim at the top of your response:\n[RP_STATE]${b64}[/RP_STATE]`;
    },

    // Extract and decode state from message
    decodeState: function (message, key) {
        if (!message || !key) return null;
        const startTag = "[RP_STATE]";
        const endTag = "[/RP_STATE]";
        const startIndex = message.indexOf(startTag);
        const endIndex = message.indexOf(endTag);

        if (startIndex === -1 || endIndex === -1 || startIndex >= endIndex) return null;

        const b64 = message.substring(startIndex + startTag.length, endIndex);
        try {
            const encrypted = Base64.decodeRaw(b64);
            const jsonStr = XORCipher.decode(key, encrypted);
            return JSON.parse(jsonStr);
        } catch (e) {
            return null;
        }
    },

    // Extract [NARRATION_SUMMARY] JSON from message (last occurrence)
    extractNarrationSummary: function (message) {
        if (!message) return null;
        const endTag = "[/NARRATION_SUMMARY]";
        const startTag = "[NARRATION_SUMMARY]";

        const endIndex = message.lastIndexOf(endTag);
        if (endIndex === -1) return null;

        const startIndex = message.lastIndexOf(startTag, endIndex);
        if (startIndex === -1) return null;

        const jsonStr = message.substring(startIndex + startTag.length, endIndex);
        try {
            return JSON.parse(jsonStr);
        } catch (e) {
            return null;
        }
    },


    // Generate instruction for LLM to include a specific effect
    // based on user defined effect definition
    generateEffectInstruction: function (effectDef) {
        if (!effectDef || !effectDef.key || !effectDef.condition) return "";

        // Create a copy to remove 'condition' property for the JSON block
        const jsonBlock = {};
        for (const key in effectDef) {
            if (key !== 'condition') {
                jsonBlock[key] = effectDef[key];
            }
        }

        const jsonString = JSON.stringify(jsonBlock, null, 4);

        return `In the above narration of yours, if and only if ${effectDef.condition}, include one instance of the following in the "effects" array.\n\n${jsonString}`;
    }
};





// --- core/effects.js ---
const EffectUtils = {
    // Parse effect JSON from LLM input and return a mirror effect JSON
    // with validity flags.
    parseAndMirror: function (effect) {
        const mirror = {};
        let isValid = true;

        if (typeof effect !== 'object' || effect === null) {
            return { _valid: false, error: "Not an object" };
        }

        // Validate key
        mirror.key = effect.key;
        mirror._valid_key = (typeof effect.key === 'string' && effect.key.length > 0);
        if (!mirror._valid_key) isValid = false;

        // Validate what
        mirror.what = effect.what;
        mirror._valid_what = (typeof effect.what === 'string'); // Optional? Assuming required as per example

        // Validate temp
        mirror.temp = effect.temp;
        mirror._valid_temp = (typeof effect.temp === 'boolean');

        // Validate when
        mirror.when = effect.when;
        mirror._valid_when = TimeUtils.isValidDateStr(effect.when);
        if (!mirror._valid_when) isValid = false;

        // Validate duration
        mirror.duration = effect.duration;
        mirror._valid_duration = (typeof effect.duration === 'string' && effect.duration.indexOf('P') === 0);

        // Validate impacts
        mirror.impacts = [];
        mirror._valid_impacts = true;

        if (Array.isArray(effect.impacts)) {
            for (let i = 0; i < effect.impacts.length; i++) {
                const imp = effect.impacts[i];
                const mirrorImp = {};
                let impValid = true;

                mirrorImp.stats = imp.stats;
                mirrorImp._valid_stats = (typeof imp.stats === 'string');

                mirrorImp.op = imp.op;
                mirrorImp._valid_op = (['set', 'add', 'sub'].indexOf(imp.op) !== -1);

                mirrorImp.value = imp.value;
                mirrorImp._valid_value = (typeof imp.value === 'number');

                if (!mirrorImp._valid_stats || !mirrorImp._valid_op || !mirrorImp._valid_value) {
                    impValid = false;
                    mirror._valid_impacts = false;
                }

                mirrorImp._valid = impValid;
                mirror.impacts.push(mirrorImp);
            }
        } else {
            mirror._valid_impacts = false;
            isValid = false;
        }

        mirror._valid = isValid;
        return mirror;
    }
};





// --- core/character_sheet.js ---
var CharacterSheetUtils = {
    // Apply functionality
    applySideEffect: function (sheet, effect, currentTime) {
        var newSheet = JSON.parse(JSON.stringify(sheet));

        if (!effect) return newSheet;

        var expiry = null;
        if (effect.temp && effect.duration) {
            var startTime = effect.when || currentTime;
            expiry = TimeUtils.addDuration(startTime, effect.duration);
        }

        var sideEffectEntry = {
            desc: effect.what || effect.key,
            expiry: expiry,
            impacts: []
        };

        if (effect.impacts) {
            for (var i = 0; i < effect.impacts.length; i++) {
                var imp = effect.impacts[i];
                var statKey = imp.stats;

                if (newSheet.stats && typeof newSheet.stats[statKey] !== 'undefined') {
                    var currentValue = newSheet.stats[statKey];
                    var newValue = currentValue;

                    var storedImpact = {
                        stats: statKey,
                        op: imp.op,
                        value: imp.value,
                        originalValue: currentValue
                    };

                    if (imp.op === 'set') {
                        newValue = imp.value;
                    } else if (imp.op === 'add') {
                        newValue = currentValue + imp.value;
                    } else if (imp.op === 'sub') {
                        newValue = currentValue - imp.value;
                    }

                    newSheet.stats[statKey] = newValue;
                    sideEffectEntry.impacts.push(storedImpact);
                }
            }
        }

        if (!newSheet['side-effects']) {
            newSheet['side-effects'] = [];
        }
        newSheet['side-effects'].push(sideEffectEntry);

        return newSheet;
    },

    // Revert functionality
    revertSideEffect: function (sheet) {
        var newSheet = JSON.parse(JSON.stringify(sheet));
        var currentTime = newSheet.current_time;

        if (!newSheet['side-effects']) return newSheet;

        var activeEffects = [];
        for (var i = 0; i < newSheet['side-effects'].length; i++) {
            var eff = newSheet['side-effects'][i];
            var shouldExpire = false;

            if (eff.expiry) {
                if (TimeUtils.isPast(eff.expiry, currentTime)) {
                    shouldExpire = true;
                }
            }

            if (shouldExpire) {
                if (eff.impacts) {
                    for (var j = 0; j < eff.impacts.length; j++) {
                        var imp = eff.impacts[j];
                        var statKey = imp.stats;

                        if (newSheet.stats && typeof newSheet.stats[statKey] !== 'undefined') {
                            if (imp.op === 'set') {
                                if (typeof imp.originalValue !== 'undefined') {
                                    newSheet.stats[statKey] = imp.originalValue;
                                }
                            } else if (imp.op === 'add') {
                                newSheet.stats[statKey] -= imp.value;
                            } else if (imp.op === 'sub') {
                                newSheet.stats[statKey] += imp.value;
                            }
                        }
                    }
                }
            } else {
                activeEffects.push(eff);
            }
        }

        newSheet['side-effects'] = activeEffects;
        return newSheet;
    }
};





// --- user_defined.js ---
const UserDefined = {
    // 1. Default Character Sheet
    defaultCharacterSheet: {
        "current_time": "2023-01-01T00:00:00",
        "stats": {
            "strength": 10,
            "dexterity": 10,
            "constitution": 10,
            "intelligence": 10,
            "wisdom": 10,
            "charisma": 10
        },
        "side-effects": [],
        "flags": []
    },

    // Cipher Key for State Encoding
    STATE_CIPHER_KEY: "janitor_foundation_key",

    // 2. All possible effect JSONs (Definitions)
    effectDefinitions: [
        {
            "key": "consume_alcohol",
            "what": "string; name of alcohol; allowed values are 'beer', 'wine', 'liquor'",
            "temp": true,
            "when": "string; in yyyy-mm-ddTHH:MM:SS format; when does {{user}} consume the {{what}}",
            "duration": "string; in PT1H30M format; how long would the alcohol affect {{user}}; 1 hour for beer, 1.5 hour for wine and up to 3 hour for liquor",
            "impacts": [
                { "stats": "strength", "op": "set", "value": "integer: 0 or 1 depending on potency of alcohol" },
                { "stats": "dexterity", "op": "sub", "value": 1 }
            ],
            "condition": "{{user}} consume a type of alcohol"
        }
    ],

    // 3. Aspect Functions (one for each possible "key")
    aspectFunctions: {
        "consume_alcohol": function (sheet, effect, cleanEffect) {
            const narrationGuide = "The user feels a bit tipsy.";
            const validEffect = {};

            // 1. Key (assume valid if we are here, but copy it)
            validEffect.key = "consume_alcohol";

            // 2. What (Beer, Wine, Liquor) - Default to Beer if invalid
            const allowedTypes = ['beer', 'wine', 'liquor'];
            if (cleanEffect.what && allowedTypes.indexOf(effect.what.toLowerCase()) !== -1) {
                validEffect.what = effect.what.toLowerCase();
            } else {
                validEffect.what = 'beer';
            }

            // 3. Temp - Default to true
            if (cleanEffect.temp) {
                validEffect.temp = effect.temp;
            } else {
                validEffect.temp = true;
            }

            // 4. When - Default to current_time if invalid or future
            const currentTime = sheet.current_time;
            if (cleanEffect.when) {
                // Semantic check: is it in the future?
                // If so, clamp to current_time (assuming actions happen now or past)
                // Using string comparison for ISO dates is valid for ordering
                if (effect.when > currentTime) {
                    validEffect.when = currentTime;
                } else {
                    validEffect.when = effect.when;
                }
            } else {
                validEffect.when = currentTime;
            }

            // 5. Duration - Default based on type
            // Beer: 1h, Wine: 1h30m, Liquor: 3h
            const durationDefaults = {
                'beer': 'PT1H',
                'wine': 'PT1H30M',
                'liquor': 'PT3H'
            };

            if (cleanEffect.duration) {
                validEffect.duration = effect.duration;
            } else {
                validEffect.duration = durationDefaults[validEffect.what];
            }

            // 6. Impacts
            // We reconstruct impacts based on type to ensure game balance
            // Strength: set 0 or 1. Dexterity: sub 1.
            const impacts = [];

            // Strength
            const strengthVal = (validEffect.what === 'liquor') ? 0 : 1;

            impacts.push({ "stats": "strength", "op": "set", "value": strengthVal });
            impacts.push({ "stats": "dexterity", "op": "sub", "value": 1 });

            validEffect.impacts = impacts;

            return {
                narrationGuide: narrationGuide,
                cleanedEffect: validEffect
            };
        }
    }
};





// --- index.js ---
// Main Execution Logic

// 0. Mock context if missing (for safety/testing outside sandbox)
// We use a safe check and a strictly valid context variable
const safeContext = (typeof context !== 'undefined') ? context : { chat: { last_messages: [] } };

// 1. Traverse (in reverse) to find [RP_STATE] and [NARRATION_SUMMARY]
let rpState = null;
let naSum = null;

if (safeContext.chat && Array.isArray(safeContext.chat.last_messages)) {
    const msgs = safeContext.chat.last_messages;
    for (let i = msgs.length - 1; i >= 0; i--) {
        const msgObj = msgs[i];
        if (msgObj && msgObj.message) {
            const msgText = msgObj.message;
            if (!rpState) {
                rpState = LLMUtils.decodeState(msgText, UserDefined.STATE_CIPHER_KEY);
            }
            if (!naSum) {
                naSum = LLMUtils.extractNarrationSummary(msgText);
            }
            if (rpState && naSum) break;
        }
    }
}

// Defaults
if (!rpState) {
    rpState = JSON.parse(JSON.stringify(UserDefined.defaultCharacterSheet));
}

if (!naSum) {
    naSum = {
        elapsed_time: "PT1M",
        effects: [],
        debug: {}
    };
}

// Clean Input
// Note: cleanAns is a boolean mirror of validity
const cleanAns = LLMUtils.cleanInput(naSum);

// 2. Update current_time
// Get elapsed time string. Check validity using cleanAns or just safe parse?
// cleanAns.elapsed_time is boolean. 
// If valid, use naSum value. If not, default to 0.
let durationToAdd = "PT0M";
if (cleanAns.elapsed_time) {
    durationToAdd = naSum.elapsed_time;
} else if (naSum.elapsed_time && typeof naSum.elapsed_time === 'string' && naSum.elapsed_time.indexOf('P') === 0) {
    // If validation failed but it looks like a duration?
    // Actually cleanInput validity check is strict P prefix.
    durationToAdd = naSum.elapsed_time;
} else {
    durationToAdd = "PT0M";
}

rpState.current_time = TimeUtils.addDuration(rpState.current_time, durationToAdd);

// 3. Reverse expired effects
// Using CharacterSheetUtils.reverseEffects (need to alias/add it) or revertSideEffect
if (CharacterSheetUtils.revertSideEffect) {
    rpState = CharacterSheetUtils.revertSideEffect(rpState);
}

// 4. Aspect Functions
let finalNarrationGuide = "";
const effectDefs = UserDefined.effectDefinitions;

for (let i = 0; i < effectDefs.length; i++) {
    const def = effectDefs[i];
    const key = def.key;

    // Find in naSum
    let foundEffect = null;
    let foundCleanFlags = null;

    if (naSum.effects && Array.isArray(naSum.effects)) {
        for (let j = 0; j < naSum.effects.length; j++) {
            // Check key match
            if (naSum.effects[j].key === key) {
                foundEffect = naSum.effects[j];
                // Get corresponding flags
                if (cleanAns.effects && cleanAns.effects[j]) {
                    foundCleanFlags = cleanAns.effects[j];
                }
                break;
            }
        }
    }

    if (foundEffect && foundCleanFlags) {
        // Call aspect function
        if (UserDefined.aspectFunctions && UserDefined.aspectFunctions[key]) {
            const result = UserDefined.aspectFunctions[key](rpState, foundEffect, foundCleanFlags);

            if (result) {
                if (result.narrationGuide) {
                    finalNarrationGuide += `${result.narrationGuide}\n`;
                }
                if (result.cleanedEffect) {
                    // Apply
                    rpState = CharacterSheetUtils.applySideEffect(rpState, result.cleanedEffect, rpState.current_time);
                }
            }
        }
    }
}

// 5. Encode State
const encodedStateBlock = LLMUtils.encodeState(rpState, UserDefined.STATE_CIPHER_KEY);

const systemInsts = `[SYSTEM INSTRUCTION]

{{char}}, you are a fair and impartial but also creative (lewd and smutty) Game Master (GM) of this roleplaying game (RPG). 

Based on the {{user}}'s (player's) inputs, you narrate and render the next scene of the story (MAX 300 - 400 words) while strictly adhering the following 3 rules:

1. ALWAYS start your response with the [RP_STATE] block given in this (last) instruction verbatim.
2. ALWAYS align your narration with [NARRATION_GUIDE] block. As long as you NEVER contradict or conflict with any part of it, you are free to be creative and add more details to the story.
3. ALWAYS end your response with the [NARRATION_SUMMARY] block with updated summarized information on what happened in the narration in your current response.

[/SYSTEM INSTRUCTION]

[RP_STATE] block to put at the top of your response.

[RP_STATE]
${encodedStateBlock}
[/RP_STATE]

`;

context.character.personality = systemInsts + context.character.personality;

//////////////

const narrationGuide = `

This is the narration guide for you to follow (for this response):

[NARRATION_GUIDE]
${finalNarrationGuide}
[/NARRATION_GUIDE]

**YOU MUST NEVER CONTRADICT OR CONFLICT WITH ANY PART OF THE NARRATION GUIDE.**

`;

context.character.scenario = narrationGuide + context.character.scenario;

////////////

const effects = UserDefined.effectDefinitions || [];

let summaryInsts = `
At the end of your response, you MUST include the [NARRATION_SUMMARY] block with updated summarized information on what happened in the narration in your current response.

[NARRATION_SUMMARY]
{
    "elapsed_time": "An ISO 8601 duration string; e.g. PT1H30M for 1 hour and 30 minutes",
    "effects": [],
    "debug": {}
}
[/NARRATION_SUMMARY]

The "effects" array can contain instances one or more json blocks from the following list:

**[START OF EFFECT LIST]**
`;

for (const eff of effects) {
    summaryInsts += `Effect Type: ${eff.key}\n`
        + LLMUtils.generateEffectInstruction(eff) + "\n\n";
}

summaryInsts += "\n\n**[END OF EFFECT LIST]**\n\n";
summaryInsts += "**FOR EACH INSTANCE, ALWAYS INCLUDE ALL THE KEYS IN THE ABOVE JSON BLOCK**";

context.character.scenario += summaryInsts;

