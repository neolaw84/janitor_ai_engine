
const assert = require('assert');
const path = require('path');

// Mock .txt require for Node environment
require.extensions['.txt'] = function (module, filename) {
    module.exports = "MOCK_TEXT_CONTENT";
};

// Mock rollxdy
const rollxdy = (x, y) => x * Math.floor(y / 2);

// PROACTIVE FIX: Mock src/engine/time (ESM)
try {
    const resolvedPath = require.resolve('../src/engine/time.js');
    require.cache[resolvedPath] = {
        id: resolvedPath,
        filename: resolvedPath,
        loaded: true,
        exports: {
            TimeManager: { addDuration: () => "MOCK", formatDateTime: () => "" }
        }
    };
} catch (e) { }

// Load the script definition
const scriptDef = require('../src/user_defined/script_def.js');
const consumeAlcohol = scriptDef.reactiveFunctions.consume_alcohol;

function createMockState() {
    return {
        data: {
            current_time: "2025-06-01T12:00:00",
            stats: {
                intoxication: 0
            },
            current_side_effects: []
        }
    };
}

console.log("Running negative reactive call tests...");

// Test Case: Value is false
{
    console.log("Test Case: Value is false");
    const state = createMockState();
    const input = false;

    const result = consumeAlcohol(state, input, rollxdy);

    // Should return guide and empty effects
    assert.strictEqual(result.guide, "If {{user}} consumes alcohol, include `consume_alcohol` in the [NARRATION_SUMMARY].\n", "Should return specific guide text");
    assert.ok(Array.isArray(result.effects), "Should return effects array");
    assert.strictEqual(result.effects.length, 0, "Should have 0 effects");

    // Verify State is NOT mutated
    assert.strictEqual(state.data.stats.intoxication, 0, "State should not be mutated");
}

console.log("Negative call test passed!");
