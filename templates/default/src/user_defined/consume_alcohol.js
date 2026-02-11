const TimeManager = require("../engine/time").TimeManager;
const sanitizeInput = require("../engine/utils").sanitizeInput;
const findBestMatch = require("../engine/utils").findBestMatch;

function consume_alcohol(state, value, rollxdy) {
    // --- Constants & Helper Data ---
    const ALLOWED_DRINKS = {
        beer: { intoxication: 1, duration: "PT1H30M" },
        cider: { intoxication: 1, duration: "PT1H30M" },
        wine: { intoxication: 2, duration: "PT2H" },
        cocktail: { intoxication: 2, duration: "PT2H" },
        whiskey: { intoxication: 3, duration: "PT2H30M" },
        vodka: { intoxication: 3, duration: "PT2H30M" },
        rum: { intoxication: 3, duration: "PT2H30M" },
        gin: { intoxication: 3, duration: "PT2H30M" },
        tequila: { intoxication: 3, duration: "PT2H30M" },
        brandy: { intoxication: 3, duration: "PT2H30M" }
    };

    const DEFAULT_DRINK = "beer";

    // --- 0. Handle Negative/Missing Input ---
    if (value === false) {
        return {
            guide: "If {{user}} consumes alcohol, include `consume_alcohol` in the [NARRATION_SUMMARY].\n",
            effects: []
        };
    }

    // --- 1. Input Sanitization ---
    // --- 1. Input Sanitization ---
    let entries = sanitizeInput(value);

    let guideOutput = "";
    const effects = [];

    // TimeManager uses the top-level require
    let TM = TimeManager;

    for (let i = 0; i < entries.length; i++) {
        let entry = entries[i];
        if (typeof entry !== 'object' || entry === null) {
            entry = {};
        }

        // --- 2. 'What' Validation ---
        let drinkType = DEFAULT_DRINK;
        let providedWhat = entry.what;
        let bestMatchKey = findBestMatch(providedWhat, ALLOWED_DRINKS);

        if (bestMatchKey) {
            drinkType = bestMatchKey;
        }

        const drinkStats = ALLOWED_DRINKS[drinkType];

        // --- 3. 'When' Validation ---
        let when = state.data.current_time;
        if (typeof entry.when === 'string') {
            if (TM.isValidIsoTime(entry.when)) {
                when = entry.when;
            }
        }

        // --- 4. 'Duration' Validation ---
        let duration = drinkStats.duration;
        if (typeof entry.duration === 'string') {
            if (TM.isValidIsoDuration(entry.duration)) {
                duration = entry.duration;
            }
        }

        // --- 5. 'Impacts' Validation ---
        let intoxicationChange = drinkStats.intoxication;
        if (entry.impacts && typeof entry.impacts === 'object') {
            const val = parseInt(entry.impacts.intoxication, 10);
            if (!isNaN(val) && val >= 1 && val <= 3) {
                intoxicationChange = val;
            }
        }

        // --- 6. Calculate Expiry ---
        let expiry = "Unknown";
        try {
            expiry = TM.addDuration(when, duration);
        } catch (e) {
            console.error("Date calculation failed", e);
            expiry = state.data.current_time;
        }

        const effect = {
            what: drinkType.charAt(0).toUpperCase() + drinkType.slice(1),
            key: "consume_alcohol",
            impacts: { intoxication: intoxicationChange },
            expiry: expiry,
            when: when,
            temp: true
        };

        effects.push(effect);
        // guideOutput += "Player consumed " + effect.what + ". Intoxication increased by " + intoxicationChange + ". Effect expires at " + expiry + ".\\n";
    }

    return {
        guide: guideOutput,
        effects: effects
    };
}

module.exports = consume_alcohol;
