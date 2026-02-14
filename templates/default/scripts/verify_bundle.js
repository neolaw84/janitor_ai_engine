const fs = require('fs');
const path = require('path');

// Load the bundle
const bundlePath = path.join(__dirname, '../dist/bundle.js');
if (!fs.existsSync(bundlePath)) {
    console.error("Bundle not found. Run 'npm run build' first.");
    process.exit(1);
}
const bundleCode = fs.readFileSync(bundlePath, 'utf8');

// Quick check that module.exports are gone from bundle
if (bundleCode.indexOf('module.exports') !== -1) {
    console.error("FAIL: Bundle contains module.exports!");
    process.exit(1);
} else {
    console.log("PASS: Bundle does not contain module.exports");
}

console.log("--- Running Integration Test with Bundle ---");

// Mock Context
const mockIntegrationContext = {
    chat: {
        last_messages: [
            { message: "Old message" },
            { message: "User action [NARRATION_SUMMARY]{\"elapsed_time\":\"PT1H\", \"effects\":[{\"key\":\"consume_alcohol\", \"what\":\"beer\"}]}[/NARRATION_SUMMARY]" }
        ]
    },
    character: {
        personality: "Initial personality.",
        scenario: "Initial scenario."
    }
};

const integrationTestCode = `
    // Context
    const context = ${JSON.stringify(mockIntegrationContext)};

    // Bundle
    ${bundleCode}

    // Asserts
    if (rpState.current_time === "2023-01-01T00:00:00") throw new Error("Index Logic failed to update time");
    if (finalNarrationGuide.indexOf("tipsy") === -1) throw new Error("Index Logic missing narration guide");
    if (encodedStateBlock.indexOf("[RP_STATE]") === -1) throw new Error("Index Logic missing encoded state");
    
    console.log("Integration Logic Passed!");
`;

try {
    eval(integrationTestCode);
} catch (e) {
    console.error("Integration Test Failure of Bundle:", e);
    process.exit(1);
}

console.log("Bundle verification complete.");
