module.exports = {
    config: {
        secretKey: "/*__PROJECT_SECRET_KEY__*/",
    },
    defaultState: {
        inventory: [],
        stats: {
            charm: 10,
            intelligence: 10,
            strength: 10
        },
        current_side_effects: [],
        current_time: "2025-06-01T12:00:00Z",
        turn_count: 0
    },
    /*
     * Summary Template
     * Defines how the [TURN_SUMMARY] should be structured and processed.
     */
    summaryTemplate: {
        drink_alcohol: {
            what: "an allowed value describing what the user drank",
            when: "ISO standard date/time string without timezone",
            temp: true,
            impacts: {
                intelligence: 0,
                charm: 0
            },
            duration: "PT1H",
            free_text: "allowed values are 'beer', 'wine' and 'liquor'. Duration should be set logically for a young woman (1 - 2 hours). Intelligence is reduced by 2 and charm is increased by 1 for 'beer' and 'wine', and intelligence is reduced by 1 and charm is increased by 2 for 'liquor'."
        }
    },
    /*
     * Standardized Functions
     * Array of functions that take 'state' and return a string for [WHAT_HAPPEN].
     * Can use 'rollxdy(x, y)' for dice rolls.
     */
    standardizedFunctions: [
        function (state, summary) {
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
            text += "Current Stats: " + JSON.stringify(state.data.stats) + "\\n";
            return text;
        },
        function (state, summary) {
            // Example using rollxdy
            // return "Luck Check (3d6): " + rollxdy(3, 6);
            return "";
        }
    ]
};
