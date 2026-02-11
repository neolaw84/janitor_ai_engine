
const fs = require('fs');
const path = require('path');
const assert = require('assert');

// We need to test src/engine/core.js which is an ESM module using 'import'.
// Node.js commonjs environment cannot require it directly without setup.
// We will manually read the file and eval it in a mock context, similar to test_harness.js.

const corePath = path.resolve(__dirname, '../src/engine/core.js');
let coreContent = fs.readFileSync(corePath, 'utf8');

// Mock TimeManager
const MockTimeManager = {
    addDuration: (time, duration) => {
        // Simple mock: just append duration text to time for verification
        return time + "_PLUS_" + duration;
    },
    formatDateTime: (time) => time
};

// Create a mock context
const mockContext = {
    TimeManager: MockTimeManager,
    // We need to capture exports
    exports: {},
    console: console
};

// Transform import to something executable in eval or naive strip
// "import { TimeManager } from "./time";" -> // import ...
// And we provide TimeManager in context.
// We also need to handle "export function" -> "exports.function ="

// 1. Remove imports
coreContent = coreContent.replace(/import .*? from .*?;/g, '');

// 2. Change exports
coreContent = coreContent.replace(/export function (\w+)/g, 'exports.$1 = function $1');

// wrap in function
const runCore = new Function('exports', 'TimeManager', coreContent);

runCore(mockContext.exports, MockTimeManager);

const { createGameState } = mockContext.exports;

console.log("Running core.js applyEffects tests (via eval mock)...");

const initialState = {
    stats: { intoxication: 0 },
    current_time: "2025-06-01T12:00:00",
    current_side_effects: []
};

// Test 1: Immediate Impact Only
{
    console.log("Test 1: Immediate Impact");
    const state = createGameState(initialState);
    const effect = {
        what: "Shot",
        impacts: { intoxication: 1 },
        temp: false
    };

    const log = state.applyEffects(effect);

    assert.strictEqual(state.data.stats.intoxication, 1, "Intoxication should increase");
    assert.strictEqual(state.data.current_side_effects.length, 0, "No side effect should be scheduled");
    assert.strictEqual(log, null, "Log should be null for non-temp effect");
}

// Test 2: Temp Effect
{
    console.log("Test 2: Temp Effect");
    const state = createGameState(initialState);
    const effect = {
        what: "Beer",
        impacts: { intoxication: 1 },
        temp: true,
        expiry: "2025-06-01T13:30:00",
        when: "2025-06-01T12:00:00"
    };

    const log = state.applyEffects(effect);

    assert.strictEqual(state.data.stats.intoxication, 1, "Intoxication should increase");
    assert.strictEqual(state.data.current_side_effects.length, 1, "Side effect should be scheduled");
    assert.strictEqual(state.data.current_side_effects[0].what, "Beer");
    assert.ok(log.includes("Effect applied"), "Log should report application");
}

console.log("Core tests passed!");
