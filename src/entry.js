"use worker;";

import { _btoa, _atob } from './engine/polyfills';
import { XORCipher } from './engine/cipher';
import { TimeManager } from './engine/time';
import { createGameState } from './engine/core';

// User Configuration (Aliased by Webpack)
import userConfig from 'user-config';

// CONFIG injection handling
// Webpack will bundle the user-config object directly.
const CONFIG = {
    secretKey: userConfig.config.secretKey,
    defaultState: userConfig.defaultState
};

// User Logic Wrapper
const UserLogic = {
    summaryTemplate: userConfig.summaryTemplate || {},
    standardizedFunctions: userConfig.standardizedFunctions || []
};

function processScript(context) {
    function ensureContext() {
        if (!context.character) context.character = {};
        if (!context.character.scenario) context.character.scenario = "";
        if (typeof context.character.scenario !== 'string') context.character.scenario = "";
        if (!context.character.personality) context.character.personality = "";
    }

    function parseLastMessage() {
        if (!context.chat || !context.chat.messages || context.chat.messages.length === 0) {
            return null;
        }
        const lastMsg = context.chat.messages[context.chat.messages.length - 1].message;

        const secretMatch = lastMsg.match(/\[SCRIPT_SECRET\]([\s\S]*?)\[\/SCRIPT_SECRET\]/);
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

        const summaryMatch = lastMsg.match(/\[TURN_SUMMARY\]([\s\S]*?)\[\/TURN_SUMMARY\]/);
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
                        const expiry = TimeManager.addDuration(state.data.current_time, duration);

                        // Create effect object for tracking
                        const effect = {
                            what: entry.what, // The value from the user summary
                            key: key,
                            impacts: rules.impacts, // Store impacts to reverse them later
                            expiry: expiry,
                            when: entry.when || state.data.current_time
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

    // Part 1: How to update the summary
    let whatHappenPart1 = "## Summary Instruction\n";
    whatHappenPart1 += "You must encompass the narration within a [TURN_SUMMARY] JSON block at the end of your response.\n";
    whatHappenPart1 += "The JSON object MUST contain 'elapsed_duration' (e.g., \"PT5M\").\n";
    whatHappenPart1 += "Additionally, strictly follow these rules for specific events:\n";

    const template = UserLogic.summaryTemplate;
    for (const key in template) {
        const rules = template[key];
        whatHappenPart1 += "- **" + key + "**: " + (rules.free_text || "") + "\n";
        whatHappenPart1 += "  Required Format: `\"" + key + "\": [{\"what\": \"...\", \"when\": \"...\"}]`\n";
        if (rules.temp) whatHappenPart1 += "  (This is a TEMPORARY effect lasting " + rules.duration + ")\n";
        if (rules.impacts) whatHappenPart1 += "  (Impacts: " + JSON.stringify(rules.impacts) + ")\n";
    }

    // Part 2: What to happen (Narrative State)
    let whatHappenPart2 = "\n## Current State & Events\n";
    if (eventsLog.length > 0) {
        whatHappenPart2 += "Recent Events:\n" + eventsLog.map(e => "- " + e).join("\n") + "\n";
    }

    const stdFunctions = UserLogic.standardizedFunctions;
    if (stdFunctions && Array.isArray(stdFunctions)) {
        for (let i = 0; i < stdFunctions.length; i++) {
            try {
                const output = stdFunctions[i](state, result.summaryData || {});
                if (output) whatHappenPart2 += output + "\n";
            } catch (e) {
                console.error("Standardized function failed:", e);
                const err = e.toString();
                if (err.includes("rollxdy is not defined")) {
                    whatHappenPart2 += "[System Error: Script function failed]\n";
                }
            }
        }
    }

    const nextSecret = XORCipher.encrypt(JSON.stringify(state.data), CONFIG.secretKey);

    const whatHappen = whatHappenPart1 + whatHappenPart2;

    const injection = "\n\n[SYSTEM INSTRUCTION]\nThe previous turn summary and state have been processed.\nYou must adhere to the following constraints for the upcoming turn:\n\n[WHAT_HAPPEN]\n" + whatHappen + "\n[/WHAT_HAPPEN]\n\nREQUIREMENTS:\n1.  At the end of your response, you MUST include a [TURN_SUMMARY]...[/TURN_SUMMARY] JSON block.\n2.  You MUST start your response with the following encrypted state block exactly as is:\n    [SCRIPT_SECRET]" + nextSecret + "[/SCRIPT_SECRET]\n";

    context.character.scenario += injection;
}

if (typeof context !== 'undefined') {
    processScript(context);
}

// Export for testing if needed
// module.exports = { processScript, XORCipher, TimeManager, createGameState };
