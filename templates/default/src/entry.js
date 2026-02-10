import { _btoa, _atob } from "./engine/polyfills";
import { XORCipher } from "./engine/cipher";
import { TimeManager } from "./engine/time";
import { createGameState, rollxdy } from "./engine/core";

// User Configuration (Aliased by Webpack)
import userConfig from "user-config";

import whatHappenHeader from "../resources/what_happen_header.txt";
import turnSummaryHeader from "../resources/turn_summary_header.txt";
import systemInstructionTemplate from "../resources/system_instruction.txt";

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

  // --- Generate Guide ([WHAT_HAPPEN]) ---

  let whatHappen = whatHappenHeader.replace(
    "{{CURRENT_TIME}}",
    TimeManager.formatDateTime(state.data.current_time)
  );

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

  let turnSummary = turnSummaryHeader;

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

  const injection = systemInstructionTemplate
    .replace("${whatHappen}", whatHappen)
    .replace("${nextSecret}", nextSecret)
    .replace("${turnSummary}", turnSummary);

  context.character.scenario += injection;
}

if (typeof context !== "undefined") {
  processScript(context);
}

// Export for testing if needed
// module.exports = { processScript, XORCipher, TimeManager, createGameState };
