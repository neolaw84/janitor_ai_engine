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
     * Update State Logic
     * This function is injected into the script.
     * 'state' is the GameState object.
     * 'summary' is the parsed [TURN_SUMMARY] object.
     * 'TimeManager' is available in scope.
     */
    updateState: function (state, summary) {
        if (summary.elapsed_duration) {
            state.updateTime(summary.elapsed_duration);
        }

        // Example custom logic:
        // if (summary.gained_item) state.data.inventory.push(summary.gained_item);
    },
    /*
     * Generate [WHAT_HAPPEN] text
     * This function is injected into the script.
     * 'state' is the GameState object.
     */
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
