# JanitorAI Script Engine

A modernized, modular system for building and managing JanitorAI worker scripts with state persistence and automated logic. Built with Node.js, Webpack, and Babel to ensure ES5 compatibility for sandbox environments.

## Directory Structure
- `src/`: Main engine source code (modularized).
- `cli/`: Command-line tools for project management.
- `templates/`: Contains project and script definition templates.
- `data/`: Private directory for your project definitions (gitignored).
- `examples/`: Sample `script_def.js` files for inspiration.
- `package.json`: Project configuration and npm scripts.
- `webpack.config.js`: Build pipeline configuration.
- `test_harness.js`: Simulates turns to test your script logic locally.
- `cleanup.js`: Removes build artifacts from a project directory.

## Getting Started

### 1. Installation
Ensure you have Node.js installed, then install the development dependencies:
```bash
npm install
```

### 2. Initialize a New Project
Create a new private workspace for your script:
```bash
npm run init -- my-cool-project
```
This creates a folder in `data/my-cool-project` with a default `script_def.js` and a README.

### 3. Define Your Logic
Edit `data/my-cool-project/script_def.js`. This file defines:
- **`defaultState`**: The initial variables (stats, inventory, etc.).
- **`summaryTemplate`**: A structured configuration that tells the engine how to process specific keys in the LLM's `[TURN_SUMMARY]`. It automatically handles:
    - **Stat Impacts**: Adding/subtracting values from your state.
    - **Temporary Effects**: Tracking effects with durations that revert automatically upon expiry.
    - **LLM Instructions**: Providing the LLM with formatting rules and descriptions.
- **`standardizedFunctions`**: An array of functions that take the current `state` as an argument and return a string for the `[WHAT_HAPPEN]` block.

### 4. Build the Script
Compile your project into a single JanitorAI-compatible script:
```bash
npm run build -- data/my-cool-project
```
This generates `data/my-cool-project/effective_script.js`. 
*Note: The script is transpiled to ES5 and is human-readable for easier auditing.*

### 5. Test Locally
Verify your logic before deploying:
```bash
node test_harness.js data/my-cool-project
```

### 6. Cleanup
Remove generated build files:
```bash
node cleanup.js my-cool-project
```

## AI-Assisted Development (with Antigravity)

This project includes specialized workflows for [Antigravity](https://github.com/google-deepmind/antigravity) (Google DeepMind's agentic AI coding assistant). If you are using Antigravity, you can automate complex tasks using natural language.

### Available Workflows
- **`/janitor-script-architect`**: Use this to modify your script configuration using natural language. You can ask it to "add a hunger stat" or "implement health regeneration logic," and it will update `script_def.js`, rebuild, and verify the changes automatically.

### How to use
1. Ensure the Antigravity agent is active in this workspace.
2. Type the slash command followed by your request:
   - `/janitor-script-architect Add a new mana stat to the fantasy-world project`

## Deployment
1. Open your character in JanitorAI.
2. Go to the **Scripts/Advanced** section.
3. Paste the contents of your `effective_script.js`.
4. Ensure your character definition or scenario explains that the LLM must start with `[SCRIPT_SECRET]` and end with `[TURN_SUMMARY]`.
