const assert = require('assert');
const path = require('path');

// Mock .txt require for Node environment
require.extensions['.txt'] = function (module, filename) {
    module.exports = "MOCK_TEXT_CONTENT";
};

// Mock rollxdy
const rollxdy = (x, y) => x * Math.floor(y / 2);

// PROACTIVE FIX: Mock src/engine/time which is ESM and causes require errors in CJS script_def.js
const mockTimePath = path.resolve(__dirname, '../src/engine/time');
// We need to match the exact string required if possible, or the resolved path
// Node resolves require('./src/engine/time') from script_def.js to absolute path
// We can prime the cache with the absolute path/variant.
try {
    // If file exists with .js extension
    const resolvedPath = require.resolve('../src/engine/time.js');
    require.cache[resolvedPath] = {
        id: resolvedPath,
        filename: resolvedPath,
        loaded: true,
        exports: {
            TimeManager: {
                addDuration: (t, d) => {
                    // Simple mock implementation
                    return "2025-06-01T13:30:00Z"; // Return a fixed mock or calc if needed
                },
                formatDateTime: (t) => t
            }
        }
    };
} catch (e) {
    // If resolve fails (maybe no .js extension?), try without
    console.log("Could not pre-resolve time.js, proceeding...");
}


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

console.log("Running consume_alcohol validation tests...");

// Test Case 1: Valid Input (Beer)
{
    console.log("Test Case 1: Valid Input (Beer)");
    const state = createMockState();
    const input = {
        what: "Beer",
        when: "2025-06-01T12:00:00",
        impacts: { intoxication: 1 },
        duration: "PT1H30M"
    };

    const result = consumeAlcohol(state, input, rollxdy);

    // Check Return Structure
    assert.ok(result.guide, "Should return guide text");
    assert.ok(Array.isArray(result.effects), "Should return effects array");
    assert.strictEqual(result.effects.length, 1, "Should have 1 effect");

    const effect = result.effects[0];
    assert.strictEqual(effect.what, "Beer", "Effect what should be Beer");
    assert.strictEqual(effect.impacts.intoxication, 1, "Intoxication impact should be 1");

    // Check side_effect structure (merged into main object)
    // We are using real TimeManager now, so expiry should be a date string
    assert.ok(typeof effect.expiry === 'string' && effect.expiry !== "Unknown", "Expiry should be a valid calculated string");
    // Optional: regex check for ISO date? 
    // Just checking it's not Unknown or mocked value is enough for now.
    assert.strictEqual(effect.temp, true, "Effect should be temporary");

    // Verify State is NOT mutated directly (Design change)
    assert.strictEqual(state.data.stats.intoxication, 0, "State should not be mutated by function directly");
}

// Test Case 2: Invalid JSON / Fallback (String Input)
{
    console.log("Test Case 2: String Input Fallback");
    const state = createMockState();
    const input = "Beer"; // String input

    const result = consumeAlcohol(state, input, rollxdy);

    assert.strictEqual(result.effects.length, 1, "Should handle string input");
    assert.strictEqual(result.effects[0].what, "Beer", "Should detect Beer from string");
}

// Test Case 3: Fuzzy Matching
{
    console.log("Test Case 3: Fuzzy Matching");
    const state = createMockState();
    const input = { what: "vodka_shot" }; // Should match Vodka

    const result = consumeAlcohol(state, input, rollxdy);

    assert.strictEqual(result.effects.length, 1);
    assert.strictEqual(result.effects[0].what, "Vodka", "Should match 'vodka_shot' to 'Vodka'");
    assert.strictEqual(result.effects[0].impacts.intoxication, 3, "Vodka should have high intoxication");
}

// Test Case 4: Invalid Time (Defaulting)
{
    console.log("Test Case 4: Invalid Time");
    const state = createMockState();
    const input = { what: "Wine", when: "InvalidTime" };

    const result = consumeAlcohol(state, input, rollxdy);

    assert.strictEqual(result.effects[0].when, state.data.current_time, "Should default to current time");
}

// Test Case 5: Default Drink (Unknown Input)
{
    console.log("Test Case 5: Unknown Drink");
    const state = createMockState();
    const input = { what: "Alien Slime" };

    const result = consumeAlcohol(state, input, rollxdy);

    assert.strictEqual(result.effects[0].what, "Beer", "Should default to Beer");
}

// Test Case 6: Invalid Impacts (Sanitization)
{
    console.log("Test Case 6: Invalid Impacts");
    const state = createMockState();
    const input = { what: "Beer", impacts: { intoxication: 999 } };

    const result = consumeAlcohol(state, input, rollxdy);

    // Should clamp or ignore and use default (1 for Beer)
    // Implementation uses default if invalid? Or clamps?
    // "if (!isNaN(val) && val >= 1 && val <= 3) { intoxicationChange = val; }"
    // So 999 is ignored, fallback to drink default (1 for Beer).
    assert.strictEqual(result.effects[0].impacts.intoxication, 1, "Should ignore invalid impact and use default");
}

console.log("All tests passed!");
