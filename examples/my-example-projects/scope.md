# Project Scope & Architecture

This document outlines the core technical challenges faced when implementing complex scripting in a stateless LLM environment (Janitor AI) and the architectural solutions employed in this project.

## Problem 1: No Persistent Storage
**The Challenge**: The Janitor AI script environment is stateless. The script executes *before* the LLM call for a given turn. Any variables or state changes made in Turn 5's script execution are lost by the time Turn 6's script runs, as the environment is reset.

**The Solution**: **State Embedding in Context**.
We utilize the chat history itself as the storage medium. We maintain a standardized JSON object representing the user defined state (stats, inventory, active effects).
-   This state is injected into the prompt wrapped in a `[RP_STATE]...[/RP_STATE]` block.
-   The LLM is instructed to return this block verbatim in its response (or we insert it into the context for the *next* turn by reading the *last* response).
-   Effectively, the chat history becomes the database.

## Problem 2: State Integrity & Hallucination
**The Challenge**: LLMs are helpful by nature. If they see a JSON object in the context that looks like `{ "health": 10 }`, and the story involves the character getting hurt, the LLM might "helpfully" update this to `{ "health": 5 }` in its output, or hallucinate new fields. This makes the storage unreliable and prone to corruption.

**The Solution**: **Symmetric Encryption (XOR)**.
Before injecting the state into the prompt, we encrypt it using a simple XOR cipher with a key.
-   The LLM sees an opaque string of characters (gibberish) within the `[RP_STATE]` block.
-   It cannot "understand" or "fix" it, so it treats it as an immutable token block.
-   The script decrypts this block at the start of the next turn to recover the exact, uncorrupted state.

## Problem 3: Lack of Language Understanding in Script
**The Challenge**: Code is deterministic; language is not. The script needs to know *what happened* in the story to update stats (e.g., "Did the user drink the potion?"). Relying on regex or keyword matching against the user's raw text input is brittle and error-prone (e.g., "I *didn't* drink the potion" vs "I drank the potion").

**The Solution**: **LLM-Driven Narration Summary**.
We leverage the LLM's comprehension capabilities. We instruct the LLM to generate a `[NARRATION_SUMMARY]...[/NARRATION_SUMMARY]` block at the end of its response.
-   This block contains a standardized JSON object summarizing key events (e.g., `events: [{ type: "consume", item: "whiskey", amount: "500ml" }]`).
-   The script in the *next* turn parses this structured JSON—which is machine-readable and accurate—to apply effects, update stats, or trigger logic.

## Problem 4: Accessibility for Non-Coders
**The Challenge**: The target audience for this tool includes writers, roleplayers, and creatives who may not have programming experience. Writing complex JavaScript logic for effect handling is a significant barrier.

**The Solution**: **AI-Assisted Development (Antigravity)**.
We provide a workflow using **Antigravity**, Google's Agentic IDE.
-   **No Coding Required**: Users simply download this repository and open it in Antigravity.
-   **Natural Language prompts**: Users describe their needs in plain English.
    -   *Example*: "I want my script to have intelligence and charm stats. When the player consumes alcohol, reduce intelligence by 3 and charm by 1 for 2 hours."
-   The AI agent writes the necessary code (updating `effectDefinitions` and `aspectFunctions`) automatically.

## Problem 5: Deployment & Execution
**The Challenge**: How do users transfer the complex, multi-file project from their local environment to the single "Script" box in the Janitor AI web interface?

**The Solution**: **Bundling via Build Script**.
The project includes a build system.
-   **Step 1**: Tell the AI agent to build the project for export to Janitor AI.
-   **Step 2**: The agent (or user) runs `npm run build`.
-   **Step 3**: This compiles all logic, including the user-defined effects and core utilities, into a single, minified file: `dist/effective_script.min.js`.
-   **Action**: Simply copy the content of this file and paste it into the "Advanced Script" section of the Janitor AI character definition.

## Problem 6: Initialization & Secrets
**The Challenge**: How do we initialize the game state or pass secret instructions (like the encryption key or initial setup) securely in the very first interactions?

**The Solution**: **Agent-Managed Secrets**.
The user does not need to manually craft the initial handshake.
-   **Workflow**: Just tell Antigravity what you need for the setup.
-   **Result**: The agent will ensure the `[SCRIPT_SECRET]` or initial state is correctly formatted and included in the first message or system prompt generation. The user will see the result in the generated response.
