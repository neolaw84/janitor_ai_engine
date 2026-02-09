# JanitorAI Script Engine

A modular system for building and managing JanitorAI worker scripts with state persistence and automated logic.

## Directory Structure
- `templates/`: Contains the base script templates (version controlled).
- `data/`: Private directory for your project definitions (gitignored).
- `examples/`: Sample `script_def.js` files for inspiration.
- `project_init.js`: Tool to create a new project.
- `script_builder.js`: Compiles your project into a single JanitorAI-compatible script.
- `test_harness.js`: Simulates turns to test your script logic locally.
- `cleanup.js`: Removes auto-generated build files.

## Getting Started

### 1. Initialize a New Project
Create a new private workspace for your script:
```bash
node project_init.js my-cool-project
```
This creates a folder in `data/my-cool-project` with a default `script_def.js`.

### 2. Define Your Logic
Edit `data/my-cool-project/script_def.js`. You can define:
- **`defaultState`**: The initial variables (stats, inventory, etc.).
- **`updateState`**: JavaScript logic to process the LLM's `[TURN_SUMMARY]`.
- **`generateWhatHappen`**: Logic to format the state into instructions for the LLM.

### 3. Build the Script
Compile your project into the final "effective" script:
```bash
node script_builder.js data/my-cool-project
```
This generates:
- `data/my-cool-project/effective_script.js`: Readable version for debugging.
- `data/my-cool-project/effective_script_min.js`: Minified version to paste into JanitorAI.

### 4. Test Locally
Verify your logic before deploying:
```bash
node test_harness.js data/my-cool-project
```

### 5. Cleanup
If you want to remove the generated `effective_script.js` files:
```bash
node cleanup.js
```

## AI-Assisted Development (with Antigravity)

This project includes specialized workflows for [Antigravity](https://github.com/google-deepmind/antigravity) (Google DeepMind's agentic AI coding assistant). If you are using Antigravity, you can automate complex tasks using natural language.

### Available Workflows
- **`/janitor-script-architect`**: Use this to modify your script configuration using natural language. You can ask it to "add a hunger stat" or "implement health regeneration logic," and it will update `script_def.js`, rebuild, and verify the changes automatically.

### How to use
1. Ensure the Antigravity agent is active in this workspace.
2. Type the slash command followed by your request:
   - `/janitor-script-architect Add a new mana stat to the bttf project`

## Deployment
1. Open your character in JanitorAI.
2. Go to the **Scripts/Advanced** section.
3. Paste the contents of your `effective_script_min.js`.
4. Ensure your character definition or scenario explains that the LLM must start with `[SCRIPT_SECRET]` and end with `[TURN_SUMMARY]`.
