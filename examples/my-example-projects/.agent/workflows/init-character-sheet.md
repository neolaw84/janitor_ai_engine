---
description: Create or update stats in defaultCharacterSheet
---

1.  Ask the user for the `current_time` (start of adventure). If the user doesn't provide it, ask them to.
    
2.  Ask the user for the list of stats and their initial values. If the user doesn't provide them, ask them to.

3.  Refer to janitor-ai-script-skill

4.  Construct the new `defaultCharacterSheet` object:
    -   `current_time`: User provided time.
    -   `stats`: User provided stats object.
    -   `side-effects`: `[]` (Empty array).
    -   `flags`: `[]` (Empty array).

5.  Use `replace_file_content` to update `src/user_defined.js` with the new `defaultCharacterSheet`. Match the indentation style (4 spaces).

    Example replacement:
    ```javascript
    // 1. Default Character Sheet
    defaultCharacterSheet: {
        "current_time": "USER_PROVIDED_TIME",
        "stats": {
            "strength": 10,
            // ... user stats
        },
        "side-effects": [],
        "flags": []
    },
    ```