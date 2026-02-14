---
description: Create or modify an effect definition and corresponding aspectFunction
---

1.  **Gather Information**:
    *   Ask the user for the **key** (unique identifier, e.g., 'cast_fireball').
    *   Ask for the **condition** (when does this happen? e.g., "{{user}} casts fireball").
    *   Ask for the **duration** (how long? e.g., "Instant", "PT1H").
    *   Ask for **impacts** (what stats change? e.g., "hp -10").

2.  **Clarification Loop**:
    *   Analyze the user's input.
    *   If the input is vague (e.g., "it does damage"), ask for specific stats and values (e.g., "Which stat? How much?").
    *   Repeat this clarification up to 3 times.
    *   Note: most RPG events (like damage or heal etc.) are not temporary (if a damage is done, it's done; there's no expiry)
    *   If still vague after 3 tries, make an **educated guess** (e.g., default to `hp` `sub` `10` for damage) and proceed.

3.  **Construct Definitions**:
    *   Generate the `effectDefinition` JSON object based on the gathered info and `src/user_defined.js` structure.
    *   Generate the `aspectFunction` code. Ensure it includes sanity checks (defaults for invalid values, e.g., clamping dates, default durations).

4.  **Apply Changes**:
    *   Refer to janitor-ai-script-skill
    *   Read `src/user_defined.js`.
    *   Update `effectDefinitions`:
        *   If the key exists in the array, replace the object.
        *   If not, append the new object to the `effectDefinitions` array.
    *   Update `aspectFunctions`:
        *   Add or update the function property `aspectFunctions["<key>"]`. 
    *   Use `replace_file_content` to apply these changes. Ensure strict adherence to the existing file structure and indentation.
    *   **Verify**: Check that the file is syntactically valid after the edit.