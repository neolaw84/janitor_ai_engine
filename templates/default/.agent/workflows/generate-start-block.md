---
description: How to generate the initial encrypted [SCRIPT_SECRET] block for your bot.
---

# Generate Initial Script Secret

Use this workflow when you have updated your `defaultState` in `script_def.js` and need to generate the encrypted block to paste into JanitorAI.

1.  Open your project directory in the terminal.
2.  Run the secret generation command:
    ```bash
    npm run generate-secret
    ```
3.  The tool will output a block starting with `[SCRIPT_SECRET]` and ending with `[/SCRIPT_SECRET]`.
4.  Copy this entire block.
5.  Paste it into your JanitorAI Character Definition (either in the Initial Message or the Scenario field), ensuring it is placed exactly where you want the bot to see it first.
