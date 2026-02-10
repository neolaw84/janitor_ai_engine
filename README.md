# JanitorAI Script Engine

A modernized, modular system for building and managing JanitorAI worker scripts with state persistence and automated logic. Built with Node.js, Webpack, and Babel to ensure ES5 compatibility for sandbox environments.

## Directory Structure

- `src/`: Source code for the scaffolding tool (`cli.js`).
- `templates/`: Contains project templates.
  - `default/`: The standard project template.
- `examples/`: Generated example projects (e.g., `my-example-project`).
- `package.json`: Dependencies for the scaffolding tool.

## Getting Started

### 1. Installation

Ensure you have Node.js (and npm) installed, then install the dependencies for the scaffolding tool:

```bash
npm install
```

### 2. Create a New Project

Use the built-in CLI tool to scaffold a new project:

```bash
# Interactive mode
node src/cli.js

# Or specify the project name
node src/cli.js my-cool-project
```

This creates a new folder (e.g., `my-cool-project`) with a complete project structure, including source code, tests, and build configuration.

### 3. Develop Your Script

Navigate to your new project directory:

```bash
cd my-cool-project
npm install
```

#### Define Logic
Edit `script_def.js`. This file defines:
- **`defaultState`**: Initial variables.
- **`summaryTemplate`**: Configuration for `[TURN_SUMMARY]`.
- **`standardizedFunctions`**: Logic for `[WHAT_HAPPEN]`.

**Resources**: Large text blocks (like system prompts) are stored in the `resources/` directory and imported into `script_def.js` or `src/entry.js`.

### 4. Build

Compile your project into a single JanitorAI-compatible script:

```bash
npm run build
```

The compiled scripts will be output to the `dist/` directory:
- `dist/effective_script.js`: Human-readable (transpiled to ES5).
- `dist/effective_script.min.js`: Minified.

### 5. Test Locally

Verify your logic using the included test harness:

```bash
npm test
```

This simulates a conversation turn and verifies the script output.

## AI-Assisted Development (with Antigravity)

This project includes specialized workflows for [Antigravity](https://github.com/google-deepmind/antigravity).

### Available Workflows

- **`/janitor-script-architect`**: Use this to modify your script configuration using natural language. You can ask it to "add a hunger stat" or "implement health regeneration logic," and it will update `script_def.js`, rebuild, and verify the changes automatically.

### How to use

1. Ensure the Antigravity agent is active in this workspace.
2. Type the slash command followed by your request:
   - `/janitor-script-architect Add a new mana stat to the fantasy-world project`

## Deployment

1. Create a new script in JanitorAI. Choose "Advanced" as the script type.
2. Paste the contents of `dist/effective_script.js` or `dist/effective_script.min.js`.
3. Ensure your character definition or scenario explains that the LLM must start with `[SCRIPT_SECRET]` and end with `[TURN_SUMMARY]`.
