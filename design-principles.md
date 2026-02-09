Here are the design principles:

- **LLM narration:** LLM is supposed to do the narration that is not against any description in the [WHAT_HAPPEN] block. As long as it does not breach any description in the [WHAT_HAPPEN] block, it should be allowed to narrate any way it would like. However, the script needs to know what happened (during the last narration) and update the state accordingly.

- **Script state update:** The script should update the `state` ([SCRIPT_SECRET]) based on the LLM's summary ([TURN_SUMMARY]). The following updates happen:
  - The time update as per how much time has elapsed since the last narration.
  - The side-effects (only temporary) reversion based on their expiration (if the current time passes the expiration time).
  - The side-effects (both permanent and temporary) update as per the LLM's summary.

- **Creation of the guide:** The script should create a narration guide ([WHAT_HAPPEN]) based on the `state` ([SCRIPT_SECRET]) and the LLM's summary ([TURN_SUMMARY]). This guide contains two parts:
  - Part 1: How to update the `summary` ([TURN_SUMMARY]) based on what happens during the narration (the first design principle) and
  - Part 2: What to happen, what must not happen during the narration for this turn.

Then, it gets to the LLM narration step again.

We should have two types of side-effects. First one is permanent side-effect, such as damage taken and drink health portions. Second one is temporary side-effect, such as intoxication, which should be removed after expiry time.

Therefore,

- The developer should define the template of `summary` ([TURN_SUMMARY]) and for each of the entry (key) in the `summary`, define when and how the LLM is supposed to update it. I want to standardize the value of each entry (in the `script_def_template.js`) as an array of objects that looks like this:
  - "what": "a string value from a list of allowed values"
  - "when": "ISO standard date/time string without timezone"
  - "temp": true or false
  - "impacts": {"stat": 0} - for all the stats that are affected by this entry (the value is always a number to be added to the stat in question; negative values are also allowed)
  - "duration": "ISO standard duration string"
  - "free text": "a free text description of how to set these values such as what values are allowed for 'what' and different 'duration' for each of the 'what' if applicable."
  - For example, if the `summary` has `drink_alcohol` key, it would look like this:
    - "what": "an allowed value describing what the user drank"
    - "when": "ISO standard date/time string without timezone"
    - "temp": true
    - "impacts": {"intelligence": ?, "charm": ?}
    - "duration": "ISO standard duration string"
    - "free text": "allowed values are 'beer', 'wine' and 'liquor'. Duration should be set logically for a young woman (1 - 2 hours). Intelligence is reduced by 2 and charm is increased by 1 for 'beer' and 'wine' and intelligence is reduced by 1 and charm is increased by 2 for 'liquor'."

- The developer should define an array of standardized functions that takes `state` ([SCRIPT_SECRET]) and `summary` ([TURN_SUMMARY]) as arguments and returns a string value. The `rollxdy` function will be available to the standardized functions defined as above. The returned string will be used to instruct the LLM on what to happen next as lines in the `what_happen` ([WHAT_HAPPEN]) block. These functions can have side-effects to the `state` variables if needed.
