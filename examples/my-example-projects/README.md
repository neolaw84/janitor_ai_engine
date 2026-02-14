# Janitor AI Foundation Script

The Foundation Script for the Janitor AI Script environment. This project serves as a secure, sandboxed RPG logic engine for handling character states, effects, and narration guidance.

---

## For Non-Developers (No Coding Required)

**You do NOT need to learn how to code to use or modify this project!**

This project is built to be easily modified using **Antigravity**, Google's Agentic IDE. If you want to change how your character behaves, add new items, or tweak the game rules, simply open this project in Antigravity and ask for what you want.

**Examples of what you can ask Antigravity:**
*   "Add a 'Coffee' item that gives +2 Dexterity for 30 minutes."
*   "Change the default character stats to be closer to a D&D Wizard."
*   "Make the 'Intoxicated' effect last longer."
*   "Add a new system where the character gets tired if they don't sleep."

Antigravity will handle all the complex code changes for you, ensuring the logic remains sound and the game plays exactly how you envision it.

---

## For Developers

If you are a developer or want to dive into the code manually, here is everything you need to know.

### Prerequisites

*   **Node.js**: Ensure you have Node.js installed.
*   **npm**: Comes with Node.js.

### Installation

```bash
npm install
```

### Project Structure

*   `src/index.js`: **Main Entry Point**. Handles the core loop: decoding state -> processing effects -> encoding state -> generating prompts.
*   `src/user_defined.js`: **Custom Logic**. This is where you will do most of your work. It contains:
    *   `defaultCharacterSheet`: The starting stats and state for a new game.
    *   `effectDefinitions`: JSON definitions of all possible effects (buffs/debuffs).
    *   `aspectFunctions`: JS functions that execute the logic for each effect.
*   `src/core/`:
    *   `character_sheet.js`: Utilities for managing the character sheet state.
    *   `effects.js`: Logic for applying and reverting effects.
*   `src/utils/`:
    *   `llm_utils.js`: Helpers for prompting and parsing LLM outputs.
    *   `time_utils.js`: Handling ISO 8601 durations and timestamps.
    *   `xor_cipher.js`: Simple obfuscation for the state string.
    *   `rng_utils.js`: Random Number Generator.

### build & Test

To build the project (bundles everything into `dist/bundle.js`):

```bash
npm run build
```

To run the unit tests (using Jest):

```bash
npm test
```

### How to Add a New Effect (Manual Way)

1.  **Define the Effect**: Open `src/user_defined.js` and add a new entry to `effectDefinitions`.
    ```javascript
    {
        "key": "my_new_effect",
        "what": "string; description...",
        "duration": "string; in PT1H format...",
        // ... impacts and conditions
    }
    ```
2.  **Implement the Logic**: In `src/user_defined.js`, add a corresponding function to `aspectFunctions`.
    ```javascript
    "my_new_effect": function (sheet, effect, cleanEffect) {
        // Validation logic
        // Return { narrationGuide: "...", cleanedEffect: { ... } }
    }
    ```
3.  **Build**: Run `npm run build` to update the distribution file.
