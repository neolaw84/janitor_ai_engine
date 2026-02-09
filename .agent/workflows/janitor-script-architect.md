---
description: Modify the Janitor AI script configuration using natural language following strict design principles
---

# Janitor Script Architect Workflow

This workflow guides you through modifying the Janitor AI script configuration (`script_def.js`) while strictly adhering to the project's design principles.

## 1. Context & Principles

Before making any changes, ensure you are following the core design principles:

1.  **LLM Narration Freedom**: The LLM handles narration. The script only guides it via `[WHAT_HAPPEN]` and receives updates of what happened in the narration via `[TURN_SUMMARY]`.
2.  **Standardized Summary Structure**: Entries in `summaryTemplate` MUST use the following schema:
    ```json
    {
      "what": "string", // Allowed values description
      "when": "ISO date string",
      "temp": boolean, // true for temporary effects (intoxication), false for permanent (damage)
      "impacts": { "stat_name": number }, // Numeric impact on stats
      "duration": "ISO duration string", // Only for temp effects
      "free text": "string" // Instructions for the LLM on how to set these values
    }
    ```
3.  **Standardized Functions**:
    - The `[WHAT_HAPPEN]` block is populated by an array of standardized functions.
    - Each function takes `state` as an argument and returns a string to be added to the narration guide.
    - Use `rollxdy(x, y)` for randomness.

## 2. Analysis Step

1.  [ ] Read `script_def.js` to understand the current configuration.
2.  [ ] Identify which parts of `defaultState`, `summaryTemplate`, or the standardized function array need modification based on the user request.

## 3. Execution Step

Modify `script_def.js` using `multi_replace_file_content`.

### Rules for Modification:
- **`defaultState`**: Initialize stats, items, and trackers here.
- **`summaryTemplate`**: Define new summary keys following the **Standardized Summary Structure** above.
- **`standardizedFunctions`**: Add or modify functions to generate narrative guidance.
    - Example:
      ```javascript
      function (state) {
          if (state.stats.health < 50) return "Describe the character feeling weak.";
          return "";
      }
      ```

## 4. Verification Step

1.  [ ] Rebuild the script:
    ```bash
    node script_builder.js
    ```
2.  [ ] Verify the build:
    ```bash
    node test_harness.js
    ```