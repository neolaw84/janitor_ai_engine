const consumeAlcoholDescription = require("../../resources/consume_alcohol_description.txt");
const TimeManager = require("../engine/time").TimeManager;
const sanitizeInput = require("../engine/utils").sanitizeInput;
const findBestMatch = require("../engine/utils").findBestMatch;

const consume_alcohol = require("./consume_alcohol");
const boxing = require("./boxing");

module.exports = {
  config: {
    secretKey: "/*__PROJECT_SECRET_KEY__*/",
  },

  defaultState: {
    inventory: [],
    stats: {
      menses_cycle: 5, // value between 1 and 28 (inclusive)
      pregnant: false,
      cm: 0, // cum_meter of player
      pcm: 0, // cum_meter of sex partner
      intoxication: 0 // valid value between 0 and 16
    },
    num_day: 1,
    current_time: "1965-11-05T10:00:00Z",
    turn_count: 0, // set with context.chat.message_count
    current_side_effects: [],
  },
  /*
   * Summary Template
   * Defines how the [NARRATION_SUMMARY] should be structured and processed.
   */
  summaryTemplate: {
    consume_alcohol: {
      what: "string; one of the allowed values based on the list provided in the context description",
      when: "ISO standard date/time string (without timezone) representing the in-game time {{user}} consumes alcohol",
      temp: true,
      impacts: {
        intoxication: "integer between 1 and 3; based on the potency of the drink",
      },
      duration: "ISO standard duration string (e.g., PT1H) representing how long the effect lasts",
      free_text: consumeAlcoholDescription,
    },
    boxing: {
      what: "string; one of the allowed moves: jab, cross, hook, uppercut, block, dodge",
      temp: true,
      free_text: "Include boxing if and only if {{user}} engages in a fight or boxing match.",
    },
  },
  /*
   * Reactive Functions
   * Object mapping narrationSummary keys to functions.
   * Executed when a specific key is present in the summary.
   */
  reactiveFunctions: {
    consume_alcohol: consume_alcohol,
    boxing: boxing,
  },

  /*
   * Proactive Functions
   * Array of functions that always run to provide context/guide.
   * Provide narrationGuide based on player's state.
   */
  proactiveFunctions: [
    function (state, rollxdy) {
      let text = "Current Time: " + state.data.current_time + "\\n";
      text += "Active Effects:\\n";
      if (state.data.current_side_effects.length === 0) {
        text += "- None\\n";
      } else {
        for (let i = 0; i < state.data.current_side_effects.length; i++) {
          const effect = state.data.current_side_effects[i];
          text += "- " + effect.what + " (Expires: " + effect.expiry + ")\\n";
        }
      }
      text += "Current Stats: " + JSON.stringify(state.data.stats) + "\\n";
      return text;
    },
    function (state, rollxdy) {
      // Example using rollxdy
      // return "Luck Check (3d6): " + rollxdy(3, 6);
      return "";
    },
  ],
};
