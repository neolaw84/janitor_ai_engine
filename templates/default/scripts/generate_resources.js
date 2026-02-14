const fs = require('fs');
const path = require('path');

// --- Load Dependencies (Simulating Bundle Environment) ---
// We need to require them effectively as if they were in the global scope for each other if they have interdependencies
// But here we can just require them in order.

const srcDir = path.join(__dirname, '../src');

// 1. Load objects
const Base64 = require(path.join(srcDir, 'utils/base64.js'));
const XORCipher = require(path.join(srcDir, 'utils/xor_cipher.js'));
// We need to make them global if other modules depend on them implicitly (like XORCipher using Base64)
// In our refactor, XORCipher does use Base64 explicitly.
global.Base64 = Base64;
global.XORCipher = XORCipher;

const UserDefined = require(path.join(srcDir, 'user_defined.js'));
const LLMUtils = require(path.join(srcDir, 'utils/llm_utils.js'));




// --- Main Execution ---

const resourcesDir = path.join(__dirname, '../resources');
const distDir = path.join(__dirname, '../dist');

// Ensure dist exists (it should if build ran, but safe check)
if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir);
}

// 0. Copy resources/system-instructions.txt to dist/
console.log("Copying system-instructions.txt to dist...");
const sysInstrPath = path.join(resourcesDir, 'system-instructions.txt');
if (fs.existsSync(sysInstrPath)) {
    fs.copyFileSync(sysInstrPath, path.join(distDir, 'system-instructions.txt'));
    console.log("Done.");
} else {
    console.warn("Warning: resources/system-instructions.txt not found.");
}

// 1. Generate dist/first-rp-state.txt
console.log("Generating first-rp-state.txt...");
const defaultSheet = UserDefined.defaultCharacterSheet;
const key = UserDefined.STATE_CIPHER_KEY;

if (!key) {
    console.error("Error: STATE_CIPHER_KEY not found in UserDefined.");
    process.exit(1);
}

const encodedState = LLMUtils.encodeState(defaultSheet, key);
// encodeState returns the full block
fs.writeFileSync(path.join(distDir, 'first-rp-state.txt'), encodedState);
console.log("Done.");


// 2. Generate resources/how-to-construct-narration-summary.txt
console.log("Generating how-to-construct-narration-summary.txt...");
const effects = UserDefined.effectDefinitions || [];
let instructions = `
At the end of your response, you MUST include the [NARRATION_SUMMARY] block with updated summarized information on what happened in the narration in your current response.

[NARRATION_SUMMARY]
{
    "elapsed_time": "An ISO 8601 duration string; e.g. PT1H30M for 1 hour and 30 minutes",
    "effects": [],
    "debug": {}
}
[/NARRATION_SUMMARY]

The "effects" array can contain instances one or more json blocks from the following list:

**[START OF EFFECT LIST]**
`;

for (const eff of effects) {
    instructions += `Effect Type: ${eff.key}\n`
        + LLMUtils.generateEffectInstruction(eff) + "\n\n";
}

instructions += "\n\n**[END OF EFFECT LIST]**\n\n";
instructions += "**FOR EACH INSTANCE, ALWAYS INCLUDE ALL THE KEYS IN THE ABOVE JSON BLOCK**";

fs.writeFileSync(path.join(distDir, 'how-to-construct-narration-summary.txt'), instructions.trim());
console.log("Done.");
