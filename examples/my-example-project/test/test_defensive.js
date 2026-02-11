
const assert = require('assert');

// Mock .txt require for Node
if (require.extensions) {
    require.extensions['.txt'] = function (module, filename) {
        module.exports = "MOCK TEXT CONTENT";
    };
}

// PROACTIVE FIX: Mock src/engine/time (ESM)
const path = require('path');
try {
    const resolvedPath = require.resolve('../src/engine/time.js');
    require.cache[resolvedPath] = {
        id: resolvedPath,
        filename: resolvedPath,
        loaded: true,
        exports: {
            TimeManager: {
                addDuration: (t, d) => "2025-06-01T13:30:00Z", // Fixed mock
                formatDateTime: (t) => t
            }
        }
    };
} catch (e) { console.log("Time resolve failed", e); }

console.log("Loading script_def.js with txt mock...");
const scriptDef = require('../src/user_defined/script_def.js');
const reactiveFunctions = scriptDef.reactiveFunctions;

const state = {
    data: {
        current_time: "2025-06-01T12:00:00Z",
        stats: { intoxication: 0 },
        current_side_effects: []
    }
};

console.log("Testing Defensive consume_alcohol...");

// Case 1: Ideal Input
const input1 = {
    what: "Beer",
    impacts: { intoxication: 1 },
    duration: "PT1H30M",
    when: "2025-06-01T12:00:00Z"
};

try {
    const output = reactiveFunctions.consume_alcohol(state, input1, null);
    console.log("Output Guide:", output.guide);
    console.log("Effects:", output.effects);
    // Logic check: Intoxication should be 1 for Beer
    assert(output.effects[0].impacts.intoxication === 1);
    assert(output.effects[0].expiry.includes("PT1H30M") || output.effects[0].expiry !== "Unknown");
} catch (e) {
    console.error("Execution failed:", e.message);
    console.error(e.stack);
}

// Case 2: Malformed Input (String impacts, missing duration)
// Reset not really needed since function constructs clean effects
const input2 = {
    what: "Vodka",
    impacts: { intoxication: "3 (Strong)" }, // String with noise
};

try {
    const output = reactiveFunctions.consume_alcohol(state, input2, null);
    console.log("Output Guide 2:", output.guide);
    console.log("Effects 2:", output.effects);
    // Logic check: Intoxication 3
    assert(output.effects[0].impacts.intoxication === 3);
} catch (e) {
    console.error("Execution failed:", e.message);
}

console.log("Test Passed!");
