---
description: Modify the Janitor AI script configuration using natural language
---

1. Read the current configuration to understand the context.
   - [ ] Read `script_def.js`

2. Modify `script_def.js` based on the user's request.
   - Use `multi_replace_file_content` to update:
     - `defaultState` (to add stats, items, or trackers).
     - `updateState` function (to add logic for processing [TURN_SUMMARY]).
     - `generateWhatHappen` function (to expose new state to the LLM).
   - Ensure the JavaScript syntax remains valid.

3. Rebuild the script.
   - [ ] `node script_builder.js`

4. Verify the build.
   - [ ] `node test_harness.js`
