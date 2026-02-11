import { createGameState } from '../src/engine/core.js';

console.log("Modules loaded. Starting tests...");

function testUpdateTime() {
    const initialState = {
        inventory: [],
        stats: { cm: 0, pcm: 0, intoxication: 0 },
        num_day: 1,
        current_time: "2026-01-02T16:00:00Z", // 4 PM Friday
        turn_count: 0,
        current_side_effects: [],
    };

    const state = createGameState(initialState);

    console.log("Testing 4PM to 5PM (Same Day)...");
    let midnights = state.updateTime("PT1H");
    console.log("Midnights:", midnights);
    if (midnights === 0) console.log("SUCCESS"); else console.error("FAILURE");

    console.log("\nTesting 9PM to 3AM (Next Day)...");
    state.data.current_time = "2026-01-02T21:00:00Z";
    midnights = state.updateTime("PT6H");
    console.log("Midnights:", midnights);
    if (midnights === 1) console.log("SUCCESS"); else console.error("FAILURE");

    console.log("\nTesting Friday 9PM to Sunday 3AM (Two Days)...");
    state.data.current_time = "2026-01-02T21:00:00Z";
    midnights = state.updateTime("P1DT6H"); // 1 day and 6 hours
    console.log("Midnights:", midnights);
    if (midnights === 2) console.log("SUCCESS"); else console.error("FAILURE");

    console.log("\nTesting No Change...");
    midnights = state.updateTime("");
    console.log("Midnights:", midnights);
    if (midnights === 0) console.log("SUCCESS"); else console.error("FAILURE");
}

try {
    testUpdateTime();
} catch (e) {
    console.error("Test failed with error:", e);
}
