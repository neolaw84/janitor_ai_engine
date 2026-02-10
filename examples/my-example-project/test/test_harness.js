const fs = require("fs");
const path = require("path");

const projectDir = process.argv[2];
if (!projectDir) {
  console.error("Usage: node test_harness.js <project_dir>");
  process.exit(1);
}

const scriptPath = path.resolve(projectDir, "dist", "effective_script.js");
if (!fs.existsSync(scriptPath)) {
  console.error(`Script not found: ${scriptPath}`);
  process.exit(1);
}

const scriptContent = fs.readFileSync(scriptPath, "utf8");

// Mock Context
const context = {
  character: {
    scenario: "Original Scenario",
    personality: "Original Personality",
  },
  chat: {
    messages: [
      {
        role: "user",
        message: "Hello",
      },
      {
        role: "assistant",
        message:
          'Hi there. [NARRATION_SUMMARY]{"elapsed_duration": "PT5M", "drink_alcohol": [{"what": "beer", "when": "2025-06-01T12:00:00Z"}]}[/NARRATION_SUMMARY]',
      },
    ],
  },
};

// Mock Worker Environment
const workerScope = {
  context: context,
  console: console,
  // Add other globals if needed by the sandbox
};

try {
  // We use eval to simulate running the script string in this context
  // In a real environment this might be a separate Worker or VM
  // But since the script is just functions and logic, eval is fine for a harness

  // Note: The script content likely has "use worker;", which is fine.
  // The script is bundled by webpack, so it wraps things in IIFE usually.
  // We need to ensure 'context' is available to the script.

  const runScript = new Function("context", scriptContent);
  runScript(context);

  console.log("Script executed successfully.");
  const narrationGuideMatch = context.character.scenario.match(/\[NARRATION_GUIDE\]([\s\S]*?)\[\/NARRATION_GUIDE\]/);
  if (narrationGuideMatch) {
    console.log("--- [NARRATION_GUIDE] Block Content ---");
    console.log(narrationGuideMatch[1].trim());
    console.log("---------------------------------------");
  } else {
    console.log("Warning: [NARRATION_GUIDE] block not found in scenario.");
  }

  if (
    context.character.scenario.includes("[SCRIPT_SECRET]") &&
    context.character.scenario.includes("[NARRATION_SUMMARY]")
  ) {
    console.log("Verification PASSED: Output contains expected tags.");
    process.exit(0);
  } else {
    console.error("Verification FAILED: Output missing expected tags.");
    process.exit(1);
  }
} catch (e) {
  console.error("Script execution failed:", e);
  process.exit(1);
}
