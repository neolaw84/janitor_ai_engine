"use worker;";

// This is how the completed script should look like.

// --- Polyfills ---
// Simple Base64 polyfill for environments where btoa/atob might be missing
const base64 = {
  chars: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
  encode: function (input) {
    let str = String(input);
    let output = "";
    for (
      let block, charCode, idx = 0, map = base64.chars;
      str.charAt(idx | 0) || ((map = "="), idx % 1);
      output += map.charAt(63 & (block >> (8 - (idx % 1) * 8)))
    ) {
      charCode = str.charCodeAt((idx += 3 / 4));
      if (charCode > 0xff) {
        throw new Error(
          "'base64.encode' failed: The string to be encoded contains characters outside of the Latin1 range.",
        );
      }
      block = (block << 8) | charCode;
    }
    return output;
  },
  decode: function (input) {
    let str = String(input).replace(/[=]+$/, "");
    if (str.length % 4 == 1) {
      throw new Error(
        "'base64.decode' failed: The string to be decoded is not correctly encoded.",
      );
    }
    let output = "";
    for (
      let bc = 0, bs, buffer, idx = 0;
      (buffer = str.charAt(idx++));
      ~buffer && ((bs = bc % 4 ? bs * 64 + bc : bc), bc++ % 4)
        ? (output += String.fromCharCode(255 & (bs >> ((-2 * bc) & 6))))
        : 0
    ) {
      buffer = base64.chars.indexOf(buffer);
    }
    return output;
  },
};

// Use provided btoa/atob if available, otherwise use polyfill
const _btoa = typeof btoa === "function" ? btoa : base64.encode;
const _atob = typeof atob === "function" ? atob : base64.decode;

// --- Configuration ---
const CONFIG = {
  secretKey: "MySecretKey123", // User should change this
  defaultState: {
    inventory: [],
    stats: {
      charm: 10,
      intelligence: 10,
      strength: 10,
    },
    current_side_effects: [],
    current_time: "2025-06-01T12:00:00Z", // Start time
    turn_count: 0,
  },
};

// --- Utilities ---

const XORCipher = {
  encrypt: function (text, key) {
    try {
      let result = "";
      for (let i = 0; i < text.length; i++) {
        result += String.fromCharCode(
          text.charCodeAt(i) ^ key.charCodeAt(i % key.length),
        );
      }
      return _btoa(result); // Base64 encode to be safe for LLM context
    } catch (e) {
      console.error("Encryption failed:", e);
      return "";
    }
  },
  decrypt: function (text, key) {
    try {
      let decoded = _atob(text);
      let result = "";
      for (let i = 0; i < decoded.length; i++) {
        result += String.fromCharCode(
          decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length),
        );
      }
      return result;
    } catch (e) {
      console.error("Decryption failed:", e);
      return null;
    }
  },
};

const TimeManager = {
  addDuration: function (isoTime, durationStr) {
    // durationStr format: "P2H15M" (ISO 8601 duration subset)
    const date = new Date(isoTime);
    const regex = /P(?:(\d+)D)?T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
    const matches = durationStr.match(regex);

    if (matches) {
      const days = parseInt(matches[1] || 0);
      const hours = parseInt(matches[2] || 0);
      const minutes = parseInt(matches[3] || 0);
      const seconds = parseInt(matches[4] || 0);

      date.setDate(date.getDate() + days);
      date.setHours(date.getHours() + hours);
      date.setMinutes(date.getMinutes() + minutes);
      date.setSeconds(date.getSeconds() + seconds);
    }
    const iso = date.toISOString();
    return iso.split(".")[0] + "Z"; // Keep it clean but preserve UTC 'Z'
  },
  isExpired: function (expiryIso, currentIso) {
    return new Date(expiryIso) <= new Date(currentIso);
  },
};

// --- Core Logic ---

function createGameState(initialState) {
  const data = JSON.parse(JSON.stringify(initialState));

  return {
    data: data,
    updateTime: function (elapsedDuration) {
      if (elapsedDuration) {
        this.data.current_time = TimeManager.addDuration(
          this.data.current_time,
          elapsedDuration,
        );
      }
    },
    applySideEffect: function (effect) {
      // defined effect structure: { what: "drink potion", impacts: { charm: 1 }, duration: "PT1H" }
      // stored effect structure: { ...effect, expiry: "ISO_DATE", original_impacts: { ... } }

      const expiry = TimeManager.addDuration(
        this.data.current_time,
        effect.duration || "PT0M",
      );

      // Apply stats
      for (const stat in effect.impacts) {
        if (this.data.stats[stat] !== undefined) {
          this.data.stats[stat] += effect.impacts[stat];
        }
      }

      // Manual copy instead of Object.assign for maximum compatibility
      const effectCopy = {};
      for (const key in effect) {
        effectCopy[key] = effect[key];
      }
      effectCopy.expiry = expiry;

      this.data.current_side_effects.push(effectCopy);

      // Sort by expiry
      this.data.current_side_effects.sort(function (a, b) {
        return new Date(a.expiry) - new Date(b.expiry);
      });
    },
    revertExpiredEffects: function () {
      const activeEffects = [];
      const revertedLog = [];

      for (let i = 0; i < this.data.current_side_effects.length; i++) {
        const effect = this.data.current_side_effects[i];
        if (TimeManager.isExpired(effect.expiry, this.data.current_time)) {
          // Revert stats
          for (const stat in effect.impacts) {
            if (this.data.stats[stat] !== undefined) {
              this.data.stats[stat] -= effect.impacts[stat];
            }
          }
          revertedLog.push("Effect expired: " + effect.what);
        } else {
          activeEffects.push(effect);
        }
      }
      this.data.current_side_effects = activeEffects;
      return revertedLog;
    },
  };
}

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

    // Extract Secret
    // Use [\s\S] instead of /s flag for ES5 compatibility
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

    // Extract Summary
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

  // Process Turn Summary (if available)
  if (result.summaryData) {
    // 1. Advance Time
    if (result.summaryData.elapsed_duration) {
      state.updateTime(result.summaryData.elapsed_duration);
    }

    // 2. Revert Expired Effects (Logic: Check expiry against NEW time)
    const reverted = state.revertExpiredEffects();
    eventsLog = eventsLog.concat(reverted);

    // 3. Apply New Effects
    if (
      result.summaryData.side_effect &&
      Array.isArray(result.summaryData.side_effect)
    ) {
      for (let i = 0; i < result.summaryData.side_effect.length; i++) {
        const effect = result.summaryData.side_effect[i];
        state.applySideEffect(effect);
        eventsLog.push("Effect applied: " + effect.what);
      }
    }
  }

  // Generate Instructions for NEXT turn
  const nextSecret = XORCipher.encrypt(
    JSON.stringify(state.data),
    CONFIG.secretKey,
  );

  // Construct [WHAT_HAPPEN] block
  let whatHappen = "Current Time: " + state.data.current_time + "\n";
  whatHappen += "Active Effects:\n";
  if (state.data.current_side_effects.length === 0) {
    whatHappen += "- None\n";
  } else {
    for (let i = 0; i < state.data.current_side_effects.length; i++) {
      const effect = state.data.current_side_effects[i];
      whatHappen += "- " + effect.what + " (Expires: " + effect.expiry + ")\n";
    }
  }
  whatHappen += "Current Stats: " + JSON.stringify(state.data.stats);

  // Injection
  const injection =
    "\n\n[SYSTEM INSTRUCTION]\nThe previous turn summary and state have been processed.\nYou must adhere to the following constraints for the upcoming turn:\n\n[WHAT_HAPPEN]\n" +
    whatHappen +
    '\n[/WHAT_HAPPEN]\n\nREQUIREMENTS:\n1.  At the end of your response, you MUST include a [TURN_SUMMARY]...[/TURN_SUMMARY] JSON block.\n    -   Include "elapsed_duration" (e.g., "PT5M" for 5 minutes).\n    -   Include "side_effect" array if significant events occur (e.g., [{"what": "drank potion", "impacts": {"charm": 5}, "duration": "PT1H"}]).\n2.  You MUST start your response with the following encrypted state block exactly as is:\n    [SCRIPT_SECRET]' +
    nextSecret +
    "[/SCRIPT_SECRET]\n";

  context.character.scenario += injection;

  // Debugging (optional, remove in prod if strictly no console)
  // console.log("Injected Instructions:", injection);
}

// --- Entry Point ---
// In a real generic script runner, 'context' is global or passed securely.
// Depending on Janitor's specific 'use worker' implementation, we might need to export or just run.
// Assuming 'context' is available in the global scope as per typical worker environments for these tools.

if (typeof context !== "undefined") {
  processScript(context);
}
