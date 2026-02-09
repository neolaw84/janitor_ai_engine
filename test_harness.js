const fs = require('fs');
const path = require('path');

// Load the script content
const scriptPath = path.join(__dirname, 'effective_script.js');
const scriptContent = fs.readFileSync(scriptPath, 'utf8');

// Mock Context
let context = {
    character: {
        personality: "A helpful assistant.",
        scenario: "You are in a room."
    },
    chat: {
        messages: []
    }
};

// Helper: Run the script in the mock context
function runScript() {
    // We wrap in a function to avoid variable pollution, but share 'context'
    // simulating the worker scope
    const run = new Function('context', scriptContent);
    run(context);
}

// Helper: Extract injected instruction
function getInjection() {
    const scenario = context.character.scenario;
    const marker = "[SYSTEM INSTRUCTION]";
    const index = scenario.lastIndexOf(marker);
    if (index === -1) return null;
    return scenario.substring(index);
}

// Helper: Extract Secret from Injection
function getSecretFromInjection(injection) {
    const match = injection.match(/\[SCRIPT_SECRET\](.*?)\[\/SCRIPT_SECRET\]/);
    return match ? match[1] : null;
}

// --- Test Sequence ---

console.log("=== Turn 1: Initialization ===");
runScript();
let injection = getInjection();
console.log("Injection found:", !!injection);
let lastSecret = getSecretFromInjection(injection);
console.log("Initial Secret:", lastSecret);

console.log("\n=== Turn 2: User Action (Drink Beer) ===");
// Simulate User/LLM interaction.
// The LLM output from Turn 1 (which includes the Secret) is now the "history" for Turn 2.
// plus the NEW LLM output that generated a Side Effect.

// Construct the "Previous Message" that the script sees.
// It must contain the Secret from the PREVIOUS turn (Turn 1 output).
// AND the user action happens, so the Summary reflects that.

// Wait... the script runs BEFORE the LLM generates the response for Turn 2?
// OR AFTER?
// "The scripts allow the user to modify the LLM instructions/prompts before the user's input it sent to the LLM."
// So the flow is:
// 1. User inputs text.
// 2. Script runs. Checks Context (History).
// 3. Script injects Instructions.
// 4. LLM sees Instructions + History + User Input.
// 5. LLM Generates Response (containing Secret + Summary).

// So, for Turn 2 to process "Drink Beer", the "Drink Beer" event must be in the HISTORY.
// Meaning the LLM *already* narrated it in Turn 1?
// OR, the script instruction says "If X happens...".
// The prompt says: "This [TURN_SUMMARY] block is to be at the end of the response. This is the LLM telling what significant event has happened... back to the script"

// Correct Flow:
// Turn 1 (Start): Script Init. Injection (Secret=Init). LLM Output: "Hello [Secret=Init] [Summary=None]"
// Turn 2 (User: "I drink beer"): Script sees T1 Output. Injects (Secret=Init). LLM Output: "You drink beer. [Secret=Init] [Summary=DrinkBeer]"
// Turn 3: Script sees T2 Output (Summary=DrinkBeer). Updates State (Charm++). Injects (Secret=NewState). LLM Output: "You feel charming. [Secret=NewState] [Summary=None]"

// So side effects apply the turn AFTER the event occurs? Yes, that matches "Based on the TURN_SUMMARY... script needs to create [WHAT_HAPPEN]".

// Let's simulate valid Turn 1 Output
const turn1Output = `
Hello traveler!
[SCRIPT_SECRET]${lastSecret}[/SCRIPT_SECRET]
[TURN_SUMMARY]
{
  "elapsed_duration": "PT5M",
  "side_effect": [
    {"what": "drink beer", "impacts": {"charm": 5}, "duration": "PT1H"}
  ]
}
[/TURN_SUMMARY]
`;

context.chat.messages.push({ message: turn1Output });

console.log("Running Script for Turn 3 (Processing Turn 2 Output)...");
runScript();
injection = getInjection();
lastSecret = getSecretFromInjection(injection);

// Verify State in Secret
// We need to decrypt it to verify without modifying the script code to export classes.
// But wait, the harness runs the script, so the classes are defined inside the 'run' Function scope.
// We can't access them directly easily.
// We'll just check the "WHAT_HAPPEN" block in the text.
const whatHappen = injection.match(/\[WHAT_HAPPEN\]([\s\S]*?)\[\/WHAT_HAPPEN\]/)[1];
console.log("WHAT_HAPPEN Block:\n", whatHappen);

if (whatHappen.includes("drink beer") && whatHappen.includes("Expires:")) {
    console.log("SUCCESS: Side effect registered.");
} else {
    console.error("FAILURE: Side effect missing.");
}

console.log("\n=== Turn 3: Expiry ===");
// Simulate Turn 2 Output (Time passes, more than 1 Hour)
const turn2Output = `
You feel woozy.
[SCRIPT_SECRET]${lastSecret}[/SCRIPT_SECRET]
[TURN_SUMMARY]
{
  "elapsed_duration": "PT2H"
}
[/TURN_SUMMARY]
`;
context.chat.messages.push({ message: turn2Output });

runScript();
injection = getInjection();
const whatHappen2 = injection.match(/\[WHAT_HAPPEN\]([\s\S]*?)\[\/WHAT_HAPPEN\]/)[1];
console.log("WHAT_HAPPEN Block (After Expiry):\n", whatHappen2);

if (whatHappen2.includes("None")) {
    console.log("SUCCESS: Side effect expired.");
} else {
    console.error("FAILURE: Side effect still active.");
}
