---
description: Update JanitorAI script definitions based on natural language requests.
---

1.  **Analyze Request**:
    Read the user's request. Assume the user is working in the root of a JanitorAI script project.
    Common patterns:
    - "Add a [stat/item/effect]"
    - "Implement [mechanic]"

2.  **Gather Context**:
    Read the following files to understand the rules and current state:
    - `script_def.js` (The file to modify)
    - `resources/` (If meaningful text extraction is needed)

3.  **Plan Modifications**:
    Based on the request, determine the necessary changes to `script_def.js`.
    - **New Stats/Items**: Update `defaultState`.
    - **New Event/Action**: Add a new key to `summaryTemplate`. Follow the schema (what, when, temp, impacts, duration, free_text).
    - **New Logic**: Add a function to `standardizedFunctions`. Ensure it accepts `(state, summary)` and returns a string for telling LLM what should happen next (i.e. `[WHAT_HAPPEN]` block).
    - **Resources**: If adding long text, create a new file in `resources/` and import it.

4.  **Apply Changes**:
    Use `replace_file_content` (or `multi_replace_file_content`) to update `script_def.js`.
    - Ensure strict JSON syntax in `defaultState` and `summaryTemplate`.
    - Ensure valid JavaScript functions in `standardizedFunctions`.

// turbo 5. **Build Project**:
Run the build command to generate the new script.
`bash
    npm run build
    `

// turbo 6. **Verify**:
Run the test harness to ensure the script compiles and runs without errors.
`bash
    npm test
    `