---
description: Update JanitorAI script definitions based on natural language requests.
---

1.  **Analyze Request**:
    Read the user's request and identify the target project. If the project name is not specified, infer it from the user's current context or ask for clarification.
    Common patterns:
    *   "Add a [stat/item/effect] to [project]"
    *   "Implement [mechanic] in [project]"

2.  **Gather Context**:
    Read the following files to understand the rules and current state:
    *   `design-principles.md` (Crucial for adherence to schema)
    *   `data/<project-name>/script_def.js` (The file to modify)

3.  **Plan Modifications**:
    Based on the request and `design-principles.md`, determine the necessary changes to `script_def.js`.
    *   **New Stats/Items**: Update `defaultState`.
    *   **New Event/Action**: Add a new key to `summaryTemplate`. follow the `design-principles.md` schema strictly (what, when, temp, impacts, duration, free_text).
    *   **New Logic**: Add a function to `standardizedFunctions`. Ensure it accepts `(state, summary)` and returns a string for `[WHAT_HAPPEN]`.

4.  **Apply Changes**:
    Use `replace_file_content` to update `data/<project-name>/script_def.js`.
    *   Ensure strict JSON syntax in `defaultState` and `summaryTemplate`.
    *   Ensure valid JavaScript functions in `standardizedFunctions`.

// turbo
5.  **Build Project**:
    Run the build command to generate the new script.
    ```bash
    npm run build -- data/<project-name>
    ```

// turbo
6.  **Verify**:
    Run the test harness to ensure the script compiles and runs without errors.
    ```bash
    node test_harness.js data/<project-name>
    ```
