"use worker;";
/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ([
/* 0 */,
/* 1 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   _atob: () => (/* binding */ _atob),
/* harmony export */   _btoa: () => (/* binding */ _btoa)
/* harmony export */ });
// Simple Base64 polyfill for environments where btoa/atob might be missing
var base64 = {
  chars: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
  encode: function encode(input) {
    var str = String(input);
    var output = "";
    for (var block, charCode, idx = 0, map = base64.chars; str.charAt(idx | 0) || (map = "=", idx % 1); output += map.charAt(63 & block >> 8 - idx % 1 * 8)) {
      charCode = str.charCodeAt(idx += 3 / 4);
      if (charCode > 0xff) {
        throw new Error("'base64.encode' failed: The string to be encoded contains characters outside of the Latin1 range.");
      }
      block = block << 8 | charCode;
    }
    return output;
  },
  decode: function decode(input) {
    var str = String(input).replace(/[=]+$/, "");
    if (str.length % 4 == 1) {
      throw new Error("'base64.decode' failed: The string to be decoded is not correctly encoded.");
    }
    var output = "";
    for (var bc = 0, bs, buffer, idx = 0; buffer = str.charAt(idx++); ~buffer && (bs = bc % 4 ? bs * 64 + bc : bc, bc++ % 4) ? output += String.fromCharCode(255 & bs >> (-2 * bc & 6)) : 0) {
      buffer = base64.chars.indexOf(buffer);
    }
    return output;
  }
};
var _btoa = typeof btoa === "function" ? btoa : base64.encode;
var _atob = typeof atob === "function" ? atob : base64.decode;

/***/ }),
/* 2 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   XORCipher: () => (/* binding */ XORCipher)
/* harmony export */ });
/* harmony import */ var _polyfills__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(1);

var XORCipher = {
  encrypt: function encrypt(text, key) {
    try {
      var result = "";
      for (var i = 0; i < text.length; i++) {
        result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
      }
      return (0,_polyfills__WEBPACK_IMPORTED_MODULE_0__._btoa)(result);
    } catch (e) {
      console.error("Encryption failed:", e);
      return "";
    }
  },
  decrypt: function decrypt(text, key) {
    try {
      var decoded = (0,_polyfills__WEBPACK_IMPORTED_MODULE_0__._atob)(text);
      var result = "";
      for (var i = 0; i < decoded.length; i++) {
        result += String.fromCharCode(decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length));
      }
      return result;
    } catch (e) {
      console.error("Decryption failed:", e);
      return null;
    }
  }
};

/***/ }),
/* 3 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   TimeManager: () => (/* binding */ TimeManager)
/* harmony export */ });
var TimeManager = {
  /**
   * Adds an ISO 8601 duration to a date string.
   * Supports Years (Y), Months (M), Weeks (W), Days (D), Hours (H), Minutes (M), and Seconds (S).
   */
  addDuration: function addDuration(isoTime, durationStr) {
    var date = new Date(isoTime);
    // Regex matches P[n]Y[n]M[n]W[n]DT[n]H[n]M[n]S
    var regex = /P(?:(\d+)Y)?(?:(\d+)M)?(?:(\d+)W)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?/;
    var matches = durationStr.match(regex);
    if (matches) {
      var years = parseInt(matches[1] || 0);
      var months = parseInt(matches[2] || 0);
      var weeks = parseInt(matches[3] || 0);
      var days = parseInt(matches[4] || 0);
      var hours = parseInt(matches[5] || 0);
      var minutes = parseInt(matches[6] || 0);
      var seconds = parseInt(matches[7] || 0);
      date.setFullYear(date.getFullYear() + years);
      date.setMonth(date.getMonth() + months);
      date.setDate(date.getDate() + weeks * 7 + days);
      date.setHours(date.getHours() + hours);
      date.setMinutes(date.getMinutes() + minutes);
      date.setSeconds(date.getSeconds() + seconds);
    }
    var iso = date.toISOString();
    return iso.split(".")[0] + "Z";
  },
  isExpired: function isExpired(expiryIso, currentIso) {
    return new Date(expiryIso) <= new Date(currentIso);
  },
  formatDateTime: function formatDateTime(isoTime) {
    var d = new Date(isoTime);
    var pad = function pad(n) {
      return (n < 10 ? "0" : "") + n;
    };
    var date = d.getUTCFullYear() + "-" + pad(d.getUTCMonth() + 1) + "-" + pad(d.getUTCDate());
    var hours = d.getUTCHours();
    var ampm = hours >= 12 ? "PM" : "AM";
    var h12 = hours % 12 || 12;
    var time = pad(h12) + ":" + pad(d.getUTCMinutes()) + ":" + pad(d.getUTCSeconds()) + " " + ampm;
    var day = d.toLocaleDateString("en-US", {
      weekday: "long",
      timeZone: "UTC"
    });
    return date + " (" + day + ") " + time;
  }
};

/***/ }),
/* 4 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   createGameState: () => (/* binding */ createGameState),
/* harmony export */   rollxdy: () => (/* binding */ rollxdy)
/* harmony export */ });
/* harmony import */ var _time__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(3);

function createGameState(initialState) {
  var data = JSON.parse(JSON.stringify(initialState));
  return {
    data: data,
    updateTime: function updateTime(elapsedDuration) {
      if (elapsedDuration) {
        this.data.current_time = _time__WEBPACK_IMPORTED_MODULE_0__.TimeManager.addDuration(this.data.current_time, elapsedDuration);
      }
    },
    applySideEffect: function applySideEffect(effect) {
      var expiry = _time__WEBPACK_IMPORTED_MODULE_0__.TimeManager.addDuration(this.data.current_time, effect.duration || "PT0M");
      for (var stat in effect.impacts) {
        if (this.data.stats[stat] !== undefined) {
          this.data.stats[stat] += effect.impacts[stat];
        }
      }
      var effectCopy = {};
      for (var key in effect) {
        effectCopy[key] = effect[key];
      }
      effectCopy.expiry = expiry;
      this.data.current_side_effects.push(effectCopy);
      this.data.current_side_effects.sort(function (a, b) {
        return new Date(a.expiry) - new Date(b.expiry);
      });
    },
    revertExpiredEffects: function revertExpiredEffects() {
      var activeEffects = [];
      var revertedLog = [];
      for (var i = 0; i < this.data.current_side_effects.length; i++) {
        var effect = this.data.current_side_effects[i];
        if (_time__WEBPACK_IMPORTED_MODULE_0__.TimeManager.isExpired(effect.expiry, this.data.current_time)) {
          for (var stat in effect.impacts) {
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
    }
  };
}
function rollxdy(x, y) {
  var total = 0;
  for (var i = 0; i < x; i++) {
    total += Math.floor(Math.random() * y) + 1;
  }
  return total;
}

/***/ }),
/* 5 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var drinkAlcoholDescription = __webpack_require__(6);
module.exports = {
  config: {
    secretKey: "/*__PROJECT_SECRET_KEY__*/"
  },
  defaultState: {
    inventory: [],
    stats: {
      charm: 10,
      intelligence: 10,
      strength: 10
    },
    current_time: "2025-06-01T12:00:00Z",
    turn_count: 0,
    current_side_effects: []
  },
  /*
   * Summary Template
   * Defines how the [NARRATION_SUMMARY] should be structured and processed.
   */
  summaryTemplate: {
    drink_alcohol: {
      what: "an allowed value describing what the user drank",
      when: "ISO standard date/time string without timezone",
      temp: true,
      impacts: {
        intelligence: 0,
        charm: 0
      },
      duration: "PT1H",
      free_text: drinkAlcoholDescription
    }
  },
  /*
   * Standardized Functions
   * Array of functions that take 'state' and return a string for [NARRATION_GUIDE].
   * Can use 'rollxdy(x, y)' for dice rolls.
   */
  standardizedFunctions: [function (state, key, value, rollxdy) {
    var text = "Current Time: " + state.data.current_time + "\\n";
    text += "Active Effects:\\n";
    if (state.data.current_side_effects.length === 0) {
      text += "- None\\n";
    } else {
      for (var i = 0; i < state.data.current_side_effects.length; i++) {
        var effect = state.data.current_side_effects[i];
        text += "- " + effect.what + " (Expires: " + effect.expiry + ")\\n";
      }
    }
    text += "Current Stats: " + JSON.stringify(state.data.stats) + "\\n";
    return text;
  }, function (state, key, value, rollxdy) {
    // Example using rollxdy
    // return "Luck Check (3d6): " + rollxdy(3, 6);
    return "";
  }]
};

/***/ }),
/* 6 */
/***/ ((module) => {

"use strict";
module.exports = "allowed values are 'beer', 'wine' and 'liquor'. Duration should be set logically for a young woman (1 - 2 hours). Intelligence is reduced by 2 and charm is increased by 1 for 'beer' and 'wine', and intelligence is reduced by 1 and charm is increased by 2 for 'liquor'.\n";

/***/ }),
/* 7 */
/***/ ((module) => {

"use strict";
module.exports = "## What MUST Happen and What MUST NOT Happen\n\n**The in-game date/time when the current turn starts (at the beginning of\nyour current response) is : {{CURRENT_TIME}}**.\n";

/***/ }),
/* 8 */
/***/ ((module) => {

"use strict";
module.exports = "## HOW TO CONSTRUCT [NARRATION_SUMMARY] BLOCK\n\nThe JSON object MUST contain 'elapsed_duration' in ISO 8601 duration format (e.g., \"PT5M\" for 5 minutes or \"P1DT2H\" for 1 day and 2 hours).\n\nAdditionally, strictly follow the following rules for specified events:\n";

/***/ }),
/* 9 */
/***/ ((module) => {

"use strict";
module.exports = "[SYSTEM INSTRUCTION]\n1. ALWAYS start your response with the [SCRIPT_SECRET] block given in the latest instruction verbatim.\n2. ALWAYS align your narration with [NARRATION_GUIDE] block. NEVER contradict or conflict with any part of it.\n3. ALWAYS end your response with the [NARRATION_SUMMARY] block with updated summarized information on what happened in the narration in your current response.\n[/SYSTEM INSTRUCTION]\n    \n\n";

/***/ }),
/* 10 */
/***/ ((module) => {

"use strict";
module.exports = "[NARRATION_GUIDE]\n${narrationGuide} \n[/NARRATION_GUIDE]\n";

/***/ }),
/* 11 */
/***/ ((module) => {

"use strict";
module.exports = "REQUIREMENTS:\n  1. You MUST start your response with the following encrypted state \n     block exactly as is (**MUST BE VERBATIM**):\n     [SCRIPT_SECRET]${nextSecret}[/SCRIPT_SECRET]\n  2. At the end of your response, you MUST include a \n     [NARRATION_SUMMARY]...[/NARRATION_SUMMARY] JSON block.\n";

/***/ }),
/* 12 */
/***/ ((module) => {

"use strict";
module.exports = "Here is how to construct it: \n${narrationSummary}\n";

/***/ })
/******/ 	]);
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	(() => {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = (module) => {
/******/ 			var getter = module && module.__esModule ?
/******/ 				() => (module['default']) :
/******/ 				() => (module);
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it needs to be in strict mode.
(() => {
"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _engine_polyfills__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(1);
/* harmony import */ var _engine_cipher__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(2);
/* harmony import */ var _engine_time__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(3);
/* harmony import */ var _engine_core__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(4);
/* harmony import */ var user_config__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(5);
/* harmony import */ var user_config__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(user_config__WEBPACK_IMPORTED_MODULE_4__);
/* harmony import */ var _resources_narration_guide_header_txt__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(7);
/* harmony import */ var _resources_narration_summary_header_txt__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(8);
/* harmony import */ var _resources_system_instruction_txt__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(9);
/* harmony import */ var _resources_narration_guide_txt__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(10);
/* harmony import */ var _resources_requirements_block_txt__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(11);
/* harmony import */ var _resources_narration_summary_txt__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(12);





// User Configuration (Aliased by Webpack)








// CONFIG injection handling
// Webpack will bundle the user-config object directly.
var CONFIG = {
  secretKey: (user_config__WEBPACK_IMPORTED_MODULE_4___default().config).secretKey,
  defaultState: (user_config__WEBPACK_IMPORTED_MODULE_4___default().defaultState)
};

// User Logic Wrapper
var UserLogic = {
  summaryTemplate: (user_config__WEBPACK_IMPORTED_MODULE_4___default().summaryTemplate) || {},
  standardizedFunctions: (user_config__WEBPACK_IMPORTED_MODULE_4___default().standardizedFunctions) || []
};
function processScript(context) {
  function ensureContext() {
    if (!context.character) context.character = {};
    if (!context.character.scenario) context.character.scenario = "";
    if (typeof context.character.scenario !== "string") context.character.scenario = "";
    if (!context.character.personality) context.character.personality = "";
  }
  function parseLastMessage() {
    if (!context.chat || !context.chat.messages || context.chat.messages.length === 0) {
      return null;
    }
    var lastMsg = context.chat.messages[context.chat.messages.length - 1].message;
    var secretMatch = lastMsg.match(/\[SCRIPT_SECRET\]([\s\S]*?)\[\/SCRIPT_SECRET\]/);
    var secretData = null;
    if (secretMatch) {
      var decrypted = _engine_cipher__WEBPACK_IMPORTED_MODULE_1__.XORCipher.decrypt(secretMatch[1], CONFIG.secretKey);
      if (decrypted) {
        try {
          secretData = JSON.parse(decrypted);
        } catch (e) {
          console.error("Failed to parse secret JSON", e);
        }
      }
    }
    var summaryMatch = lastMsg.match(/\[NARRATION_SUMMARY\]([\s\S]*?)\[\/NARRATION_SUMMARY\]/);
    var summaryData = null;
    if (summaryMatch) {
      try {
        summaryData = JSON.parse(summaryMatch[1]);
      } catch (e) {
        console.error("Failed to parse summary JSON", e);
      }
    }
    return {
      secretData: secretData,
      summaryData: summaryData
    };
  }
  ensureContext();
  var result = parseLastMessage() || {};
  var state = (0,_engine_core__WEBPACK_IMPORTED_MODULE_3__.createGameState)(result.secretData || CONFIG.defaultState);
  state.data.turn_count++;
  var eventsLog = [];
  if (result.summaryData) {
    // 1. Time Update
    if (result.summaryData.elapsed_duration) {
      state.updateTime(result.summaryData.elapsed_duration);
    }

    // 2. Revert Expired Effects
    var reverted = state.revertExpiredEffects();
    eventsLog = eventsLog.concat(reverted);

    // 3. Process Summary Data based on Template
    var _template = UserLogic.summaryTemplate;
    for (var key in result.summaryData) {
      if (_template[key] && Array.isArray(result.summaryData[key])) {
        var entries = result.summaryData[key];
        var rules = _template[key];
        for (var i = 0; i < entries.length; i++) {
          var entry = entries[i];

          // Apply impacts (Immediate)
          if (rules.impacts) {
            for (var stat in rules.impacts) {
              if (state.data.stats[stat] !== undefined) {
                state.data.stats[stat] += rules.impacts[stat];
              }
            }
          }

          // Handle temporary effects (Future Reversion)
          if (rules.temp) {
            var duration = rules.duration || "PT0M";
            var expiry = _engine_time__WEBPACK_IMPORTED_MODULE_2__.TimeManager.addDuration(entry.when || state.data.current_time, duration);

            // Create effect object for tracking
            var effect = {
              what: entry.what,
              // The value from the user summary
              key: key,
              impacts: rules.impacts,
              // Store impacts to reverse them later
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

  // --- Generate Guide ([NARRATION_GUIDE]) ---

  // --- Generate Guide ([NARRATION_GUIDE]) ---

  var narrationGuide = _resources_narration_guide_header_txt__WEBPACK_IMPORTED_MODULE_5__.replace("{{CURRENT_TIME}}", _engine_time__WEBPACK_IMPORTED_MODULE_2__.TimeManager.formatDateTime(state.data.current_time));
  var summaryData = result.summaryData || {};
  var stdFunctions = UserLogic.standardizedFunctions;
  var narrationGuidePart2 = "";
  if (stdFunctions && Array.isArray(stdFunctions)) {
    for (var _key in summaryData) {
      var value = summaryData[_key];
      for (var _i = 0; _i < stdFunctions.length; _i++) {
        try {
          var output = stdFunctions[_i](state, _key, value, _engine_core__WEBPACK_IMPORTED_MODULE_3__.rollxdy);
          if (output) {
            narrationGuidePart2 += output + "\n";
            break;
          }
        } catch (e) {
          console.error("Standardized function failed for key " + _key + ":", e);
          var err = e.toString();
          if (err.includes("rollxdy is not defined")) {
            narrationGuidePart2 += "[System Error: Script function failed]\n";
          }
        }
      }
    }
  }
  narrationGuide += narrationGuidePart2;
  var nextSecret = _engine_cipher__WEBPACK_IMPORTED_MODULE_1__.XORCipher.encrypt(JSON.stringify(state.data), CONFIG.secretKey);
  var narrationSummary = _resources_narration_summary_header_txt__WEBPACK_IMPORTED_MODULE_6__;
  var template = UserLogic.summaryTemplate;
  for (var _key2 in template) {
    var _rules = template[_key2];
    var schema = {
      what: _rules.what,
      when: _rules.when,
      temp: _rules.temp,
      impacts: _rules.impacts,
      duration: _rules.duration
    };
    narrationSummary += "\n   ".concat(_rules.free_text || "", "\n   key: ").concat(_key2, "\n   value: ").concat(JSON.stringify(schema, null, 2), "\n   ");
  }
  var injection = _resources_system_instruction_txt__WEBPACK_IMPORTED_MODULE_7__ + "\n" + _resources_narration_guide_txt__WEBPACK_IMPORTED_MODULE_8__.replace("${narrationGuide}", narrationGuide) + "\n" + _resources_requirements_block_txt__WEBPACK_IMPORTED_MODULE_9__.replace("${nextSecret}", nextSecret) + "\n" + _resources_narration_summary_txt__WEBPACK_IMPORTED_MODULE_10__.replace("${narrationSummary}", narrationSummary);
  context.character.scenario += injection;
}
if (typeof context !== "undefined") {
  processScript(context);
}

// Export for testing if needed
// module.exports = { processScript, XORCipher, TimeManager, createGameState };
})();

/******/ })()
;