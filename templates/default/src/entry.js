import { _btoa, _atob, XORCipher } from "./engine/polyfills.js";
import { TimeManager } from "./engine/time.js";
import { createGameState, rollxdy } from "./engine/core.js";
import { PromptFactory } from "./engine/prompt_factory.js";

// User Configuration (Aliased by Webpack)
import userConfig from "user-config";

import narrationGuideHeader from "../resources/narration_guide_header.txt";
import narrationSummaryHeader from "../resources/narration_summary_header.txt";
import systemInstructionTemplate from "../resources/system_instruction.txt";
import narrationGuideTemplate from "../resources/narration_guide.txt";

// CONFIG injection handling
// Webpack will bundle the user-config object directly.
const CONFIG = {
  secretKey: userConfig.config.secretKey,
  defaultState: userConfig.defaultState,
};

// User Logic Wrapper
const UserLogic = {
  summaryTemplate: userConfig.summaryTemplate || {},
  reactiveFunctions: userConfig.reactiveFunctions || {},
  proactiveFunctions: userConfig.proactiveFunctions || [],
};

function processScript(context) {
  function ensureContext() {
    context.character = context.character || {};
    context.character.scenario = (typeof context.character.scenario === "string" && context.character.scenario) || "";
    context.character.personality = context.character.personality || "";
  }

  function parseLastMessage() {
    if (
      !context.chat ||
      !context.chat.last_messages ||
      context.chat.last_messages.length === 0
    ) {
      return { secretData: CONFIG.defaultState, summaryData: { elapsed_duration: "PT0M" } };
    }
    const lastMsg =
      context.chat.last_messages[context.chat.last_messages.length - 2].message;

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
      /\[NARRATION_SUMMARY\]([\s\S]*?)\[\/NARRATION_SUMMARY\]/,
    );
    let summaryData = null;
    if (summaryMatch) {
      console.log("Summary found in last message");
      try {
        console.log("Summary data:", summaryMatch[1]);
        summaryData = JSON.parse(summaryMatch[1]);
      } catch (e) {
        console.error("Failed to parse summary JSON", e);
      }
    } else {
      console.error("No summary found in last message");
    }

    return { secretData: secretData, summaryData: summaryData };
  }

  ensureContext();

  const result = parseLastMessage() || {};
  const state = createGameState(result.secretData || CONFIG.defaultState);
  state.data.turn_count++;


  if (result.summaryData) {
    // 1. Time Update
    const elapsed = result.summaryData.elapsed_duration;
    const duration = TimeManager.isValidIsoDuration(elapsed) ? elapsed : "PT5M";
    const daysPassed = state.updateTime(duration);
    state.data.num_day += daysPassed;

    // 2. Revert Expired Effects
    state.revertExpiredEffects();
  }

  let narrationGuide = narrationGuideHeader.replace(
    "{{CURRENT_TIME}}",
    TimeManager.formatDateTime(state.data.current_time)
  );

  const summaryData = result.summaryData || {};
  let narrationGuidePart2 = "";

  // 1. Reactive Functions (Key-based from Summary)
  const reactiveFuncs = UserLogic.reactiveFunctions;
  // Iterate over all DEFINED reactive functions, not just summary keys
  for (const key in reactiveFuncs) {
    if (typeof reactiveFuncs[key] === "function") {
      try {
        // Value is either the summary data or false if missing
        let value = false;
        if (summaryData && summaryData.hasOwnProperty(key)) {
          value = summaryData[key];
        }

        const output = reactiveFuncs[key](state, value, rollxdy);

        // Handle Object Return { guide, effects }
        if (output && typeof output === 'object') {
          if (output.guide) narrationGuidePart2 += output.guide + "\n";

          if (output.effects && Array.isArray(output.effects)) {
            for (let i = 0; i < output.effects.length; i++) {
              state.applyEffects(output.effects[i]);
            }
          }
        }
        // Handle Legacy String Return
        else if (output && typeof output === "string") {
          narrationGuidePart2 += output + "\n";
        }
      } catch (e) {
        console.error("Reactive function failed for key " + key + ":", e);
      }
    }
  }

  // 2. Proactive Functions (State-based, always run)
  const proactiveFuncs = UserLogic.proactiveFunctions;
  if (proactiveFuncs && Array.isArray(proactiveFuncs)) {
    for (let i = 0; i < proactiveFuncs.length; i++) {
      try {
        const output = proactiveFuncs[i](state, rollxdy);
        if (output && typeof output === "string") narrationGuidePart2 += output + "\n";
      } catch (e) {
        console.error("Proactive function failed at index " + i + ":", e);
      }
    }
  }
  narrationGuide += narrationGuidePart2;

  const nextSecret = XORCipher.encrypt(
    JSON.stringify(state.data),
    CONFIG.secretKey,
  );

  const narrationSummary = PromptFactory.createNarrationSummary(
    narrationSummaryHeader,
    UserLogic.summaryTemplate
  );

  const personality_prepend = PromptFactory.createPersonalityPrepend(
    systemInstructionTemplate,
    nextSecret,
    context.character.personality
  );

  console.log("personality_prepend", personality_prepend);

  context.character.personality = personality_prepend + "\n" + context.character.personality;

  const scenario_append = PromptFactory.createScenarioAppend(
    narrationGuideTemplate,
    narrationGuide,
    narrationSummary
  );

  console.log("scenario_append", scenario_append);

  context.character.scenario += scenario_append;
}

if (typeof context !== "undefined") {
  processScript(context);
}

// Export for testing if needed
// module.exports = { processScript, XORCipher, TimeManager, createGameState };
