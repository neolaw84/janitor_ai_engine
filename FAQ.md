# Frequently Asked Questions (FAQ)

This FAQ guide explains how to use the JanitorAI Script Scaffolder, whether you're a seasoned javascript developer or a bot creator without programming experience.

## General Usage

### How do I use this library?

**For Developers (with Programming Background):**
1.  **Scaffold**: Run `node src/cli.js <project-name>` to create a new project with a standardized structure.
2.  **Configure**: Edit `script_def.js` to define your initial state (`defaultState`), turn summary templates (`summaryTemplate`), and custom logic functions (`standardizedFunctions`).
3.  **Test**: Run `npm test` in your project directory to verify your script logic with a local test harness.
4.  **Build**: Run `npm run build` to generate a minified script (`dist/effective_script.min.js`).
5.  **Deploy**: Copy the content of the built script and paste it into the "Script" field of your JanitorAI character.

```markdown
**For Bot Creators (Non-Programming Background):**
1.  **Leverage AI**: You don't need to write code manually. You may use an AI-enabled IDE (Integrated Development Environment) like Google's *Antigravity* (no relation to this library), or any other AI assistant to make the technical weight disappear. After opening this library (downloaded from github) in one such IDE, use prompts like following to get the AI to create the steps for you.
2.  **Prompt to Scaffold**: Ask the AI: *"Use the JanitorAI Script Scaffolder to initialize a new project called 'SurvivalSim'."*
3.  **Prompt to Configure**: Describe your logic in plain English: *"In `script_def.js`, set a `defaultState` with `hunger: 0`. Create a function that increases hunger by 10 every turn and resets it to 0 if the user mentions 'eating'."*
4.  **Prompt to Test**: Ensure it works: *"Run a test where the user waits for 3 turns and then eats; verify the hunger levels are tracked correctly."*
5.  **Prompt to Build & Deploy**: Get the final output: *"Run the build script and provide the minified code from `dist/effective_script.min.js` so I can paste it into JanitorAI."*
```

## Common Questions

### Q: Scripts in Janitor AI running in this turn does not remember what the script did in previous turn. How to make it remember?

**A:** By design, LLM interactions are stateless between turns unless you explicitly provide context. This library solves this by maintaining a persistent **State**. The script automatically saves your variables (like health, inventory, time) into an block called `[SCRIPT_SECRET]` and instruct the LLM to include it in the next turn. At the start of each turn, the script retrieves this block, updates the values based on what happened, and then sends it back to the LLM for the next turn. You just need to define what variables you want to track in `defaultState` within `script_def.js`.

### Q: The Gen AI (LLM) is changing the STATE and send me back corrupted/updated version regardless of my instruction not to. How to stop it from changing it?

**A:** This is a common problem known as "hallucination" or failure to follow negative constraints. We solve this by using **Encryption**. The state is stored in the `[SCRIPT_SECRET]` block, which is encrypted using a key (XOR Cipher). The LLM sees only a string of random-looking characters and cannot interpret or modify it meaningfully. This forces the LLM to treat the block as an opaque object that it must copy verbatim, preventing it from "helpfully" updating your state logic incorrectly.

### Q: My script does not know how to interpret the text the user inputs and the text the bot is producing. How to get structured summary about what is happening?

**A:** We use a technique called **Structured Summarization**. Instead of asking the script to "guess" what happened from raw text, we instruct the LLM to output a specific JSON summary at the end of its response, inside a `[NARRATION_SUMMARY]` block. You define the structure of this summary in `summaryTemplate` (in `script_def.js`). For example, you can define that if the user drinks a potion, the LLM must output `{"side_effect": "potion_active"}`. The script then parses this JSON to accurately update the game state.

### Q: I don't know how to code. How do I update `state_def.js` (or `script_def.js`) without making mistakes?

**A:** If you are not comfortable editing JSON or JavaScript files directly, **do not do it manually**. The slightest syntax error (like a missing comma) can break the script. Instead, rely on your AI assisted IDE. Tell the assistant exactly what you want to change (e.g., "Add a new 'mana' stat that starts at 100"), and let the assistant generate the correctly formatted code for you. This ensures that the syntax is always valid.

### Q: How do I test if my script is working before putting it on JanitorAI?

**A:** Each project comes with a built-in test harness. Simply run `npm test` in your project folder. This will simulate a conversation turn, generate a response, and verify that the `[SCRIPT_SECRET]`, `[NARRATION_GUIDE]`, and `[NARRATION_SUMMARY]` blocks are being generated and processed correctly.

### Q: Can I change the encryption key?

**A:** Yes. The encryption key is defined in your project's configuration. While the default key works for preventing casual LLM interference, you can change it to something unique for your bot if you prefer.
