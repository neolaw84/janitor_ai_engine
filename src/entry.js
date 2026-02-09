import { _btoa, _atob } from "./engine/polyfills";
import { XORCipher } from "./engine/cipher";
import { TimeManager } from "./engine/time";
import { createGameState, rollxdy } from "./engine/core";

// User Configuration (Aliased by Webpack)
import userConfig from "user-config";

// CONFIG injection handling
// Webpack will bundle the user-config object directly.
const CONFIG = {
  secretKey: userConfig.config.secretKey,
  defaultState: userConfig.defaultState,
};

// User Logic Wrapper
const UserLogic = {
  summaryTemplate: userConfig.summaryTemplate || {},
  standardizedFunctions: userConfig.standardizedFunctions || [],
};

function processScript(context) {
  function ensureContext() {
    if (!context.character) context.character = {};
    if (!context.character.scenario) context.character.scenario = "";
    if (typeof context.character.scenario !== "string")
      context.character.scenario = "";
    if (!context.character.personality) context.character.personality = "";
  }

  function parseLastMessage() {
    if (
      !context.chat ||
      !context.chat.messages ||
      context.chat.messages.length === 0
    ) {
      return null;
    }
    const lastMsg =
      context.chat.messages[context.chat.messages.length - 1].message;

    const secretMatch = lastMsg.match(
      /\[SCRIPT_SECRET\]([\s\S]*?)\[\/SCRIPT_SECRET\]/,
    );
    let secretData = null;
    if (secretMatch) {
      const decrypted = XORCipher.decrypt(secretMatch[1], CONFIG.secretKey);
      if (decrypted) {
        try {
          secretData = JSON.parse(decrypted);
        } catch (e) {
          console.error("Failed to parse secret JSON", e);
        }
      }
    }

    const summaryMatch = lastMsg.match(
      /\[TURN_SUMMARY\]([\s\S]*?)\[\/TURN_SUMMARY\]/,
    );
    let summaryData = null;
    if (summaryMatch) {
      try {
        summaryData = JSON.parse(summaryMatch[1]);
      } catch (e) {
        console.error("Failed to parse summary JSON", e);
      }
    }

    return { secretData: secretData, summaryData: summaryData };
  }

  ensureContext();

  const result = parseLastMessage() || {};
  const state = createGameState(result.secretData || CONFIG.defaultState);
  state.data.turn_count++;

  let eventsLog = [];

  if (result.summaryData) {
    // 1. Time Update
    if (result.summaryData.elapsed_duration) {
      state.updateTime(result.summaryData.elapsed_duration);
    }

    // 2. Revert Expired Effects
    const reverted = state.revertExpiredEffects();
    eventsLog = eventsLog.concat(reverted);

    // 3. Process Summary Data based on Template
    const template = UserLogic.summaryTemplate;
    for (const key in result.summaryData) {
      if (template[key] && Array.isArray(result.summaryData[key])) {
        const entries = result.summaryData[key];
        const rules = template[key];

        for (let i = 0; i < entries.length; i++) {
          const entry = entries[i];

          // Apply impacts (Immediate)
          if (rules.impacts) {
            for (const stat in rules.impacts) {
              if (state.data.stats[stat] !== undefined) {
                state.data.stats[stat] += rules.impacts[stat];
              }
            }
          }

          // Handle temporary effects (Future Reversion)
          if (rules.temp) {
            const duration = rules.duration || "PT0M";
            const expiry = TimeManager.addDuration(
              entry.when || state.data.current_time,
              duration,
            );

            // Create effect object for tracking
            const effect = {
              what: entry.what, // The value from the user summary
              key: key,
              impacts: rules.impacts, // Store impacts to reverse them later
              expiry: expiry,
              when: entry.when || state.data.current_time,
            };

            state.data.current_side_effects.push(effect);
            state.data.current_side_effects.sort(function (a, b) {
              return new Date(a.expiry) - new Date(b.expiry);
            });
            eventsLog.push("Effect applied: " + entry.what);
          }
        }
      }
    }
  }

  // --- Generate Guide ([WHAT_HAPPEN]) ---

  let whatHappen = `
## What MUST Happen and What MUST NOT Happen

**The in-game date/time when the current turn starts (at the beginning of
your current response) is : ${TimeManager.formatDateTime(state.data.current_time)}**.
`;

  const summaryData = result.summaryData || {};
  const stdFunctions = UserLogic.standardizedFunctions;

  if (stdFunctions && Array.isArray(stdFunctions)) {
    for (const key in summaryData) {
      const value = summaryData[key];
      for (let i = 0; i < stdFunctions.length; i++) {
        try {
          const output = stdFunctions[i](state, key, value, rollxdy);
          if (output) {
            whatHappenPart2 += output + "\n";
            break;
          }
        } catch (e) {
          console.error("Standardized function failed for key " + key + ":", e);
          const err = e.toString();
          if (err.includes("rollxdy is not defined")) {
            whatHappenPart2 += "[System Error: Script function failed]\n";
          }
        }
      }
    }
  }

  const nextSecret = XORCipher.encrypt(
    JSON.stringify(state.data),
    CONFIG.secretKey,
  );

  let turnSummary = `
   ## HOW TO CONSTRUCT [TURN_SUMMARY] BLOCK

   The JSON object MUST contain 'elapsed_duration' in ISO 8601 duration 
   format (e.g., "PT5M" for 5 minutes or "P1DT2H" for 1 day and 2 hours).

   Additionally, strictly follow the following rules for specified events:
`;

  const template = UserLogic.summaryTemplate;

  for (const key in template) {
    const rules = template[key];
    const schema = {
      what: rules.what,
      when: rules.when,
      temp: rules.temp,
      impacts: rules.impacts,
      duration: rules.duration,
    };

    turnSummary += `
   ${rules.free_text || ""}
   key: ${key}
   value: ${JSON.stringify(schema, null, 2)}
   `;
  }

  const injection =
    `
[SYSTEM INSTRUCTION]
This role-play is enabled by you, {{char}}, and an external script.

The external script does not have any storage. Therefore, it will 
send an encrypted data block to you in the [SCRIPT_SECRET] block. 
ALWAYS start your response with the [SCRIPT_SECRET] block verbatim.

As an LLM, you are NOT good with mathematics, logic, game-play rules, 
random numbers, and keeping track of time. Thus, do NOT attempt them. 
The external script will handle all of these tasks and tell you what 
must and must not happen in the role-play in the [WHAT_HAPPEN] block.

As an LLM, you are good with narration. Feel free to narrate as long as
your narration does NOT conflict or contradict with [WHAT_HAPPEN] block. 
Budget your narration accordingly to have complete [TURN_SUMMARY] block 
(see next paragraph).

As a computer script, the script does NOT know what you have narrated. 
Therefore, you must provide a summary of your current narration (this
response you are making) in the [TURN_SUMMARY] block at the end of
your response.
[/SYSTEM INSTRUCTION]
    
[WHAT_HAPPEN]
${whatHappen} 
[/WHAT_HAPPEN]
    
REQUIREMENTS:
  1. You MUST start your response with the following encrypted state 
     block exactly as is (**MUST BE VERBATIM**):
     [SCRIPT_SECRET]${nextSecret}[/SCRIPT_SECRET]
  2. At the end of your response, you MUST include a 
     [TURN_SUMMARY]...[/TURN_SUMMARY] JSON block.
     Here is how to construct it: 
${turnSummary}
`;

  context.character.scenario += injection;
}

if (typeof context !== "undefined") {
  processScript(context);
}

// Export for testing if needed
// module.exports = { processScript, XORCipher, TimeManager, createGameState };
