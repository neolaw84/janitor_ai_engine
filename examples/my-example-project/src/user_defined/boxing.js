const sanitizeInput = require("../engine/utils").sanitizeInput;
const findBestMatch = require("../engine/utils").findBestMatch;

function boxing(state, value, rollxdy) {
    let guideOutput = "";

    // --- 0. Handle Negative/Missing Input ---
    if (value === false) {
        return {
            guide: "If {{user}} engages in a boxing match or fight using moves like jab, cross, hook, uppercut, block, or dodge, include `boxing` in the [NARRATION_SUMMARY]. \n" +
                "Specify the move used (e.g., 'jab') as the value or object property.\n",
            effects: []
        };
    }

    // --- Constants & Helper Data ---
    const MOVES = {
        jab: { damage: 1, speed: 3, description: "a quick jab" },
        cross: { damage: 2, speed: 2, description: "a strong cross" },
        hook: { damage: 3, speed: 1, description: "a powerful hook" },
        uppercut: { damage: 4, speed: 1, description: "a devastating uppercut" },
        block: { damage: 0, speed: 0, description: "a defensive block" },
        dodge: { damage: 0, speed: 0, description: "a nimble dodge" }
    };

    const DEFAULT_MOVE = "jab";

    let entries = sanitizeInput(value);

    // If input is just a string, wrap it
    if (typeof value === 'string') {
        entries = [{ what: value }];
    }

    const effects = [];

    if (entries.length > 0) {
        for (let i = 0; i < entries.length; i++) {
            let entry = entries[i];
            if (typeof entry !== 'object' || entry === null) {
                entry = {};
            }

            let moveKey = DEFAULT_MOVE;
            let providedWhat = entry.what || (typeof value === 'string' ? value : DEFAULT_MOVE);
            let bestMatchKey = findBestMatch(providedWhat, MOVES);

            if (bestMatchKey) {
                moveKey = bestMatchKey;
            } else {
                // If specific move not found, default to jab or infer from context
                moveKey = DEFAULT_MOVE;
            }

            const moveStats = MOVES[moveKey];

            // Narrative generation based on dice roll
            let roll = rollxdy(3, 6); // standard 3d6 roll

            // Intoxication penalty
            let intoxicationLevel = 0;
            if (state.data.stats && state.data.stats.intoxication) {
                intoxicationLevel = Math.floor(state.data.stats.intoxication / 4);
            }

            roll -= intoxicationLevel;

            let successThreshold = 10;
            if (moveKey === 'uppercut' || moveKey === 'hook') successThreshold = 12; // Harder moves

            if (roll >= successThreshold) {
                guideOutput += `{{user}} successfully executes ${moveStats.description}! `;
                if (roll >= successThreshold + 3) {
                    guideOutput += "It's a critical hit! The opponent is staggered on impact. ";
                } else {
                    guideOutput += "It connects solidly. ";
                }
            } else {
                guideOutput += `{{user}} attempts ${moveStats.description} but misses or is blocked. `;
                if (roll <= 5) {
                    guideOutput += "They overextend and leave themselves wide open! ";
                }
            }

            // Add effect for tracking
            const effect = {
                what: `Boxed (${moveKey})`,
                key: "boxing",
                impacts: {},
                temp: true,
                expiry: state.data.current_time
            };
            effects.push(effect);
        }
    }

    return {
        guide: guideOutput,
        effects: effects
    };
}

module.exports = boxing;
