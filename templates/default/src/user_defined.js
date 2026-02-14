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


if (typeof module !== 'undefined') module.exports = UserDefined;
