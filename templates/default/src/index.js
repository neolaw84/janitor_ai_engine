// Main Execution Logic

// 0. Mock context if missing (for safety/testing outside sandbox)
// We use a safe check and a strictly valid context variable
const safeContext = (typeof context !== 'undefined') ? context : { chat: { last_messages: [] } };

// 1. Traverse (in reverse) to find [RP_STATE] and [NARRATION_SUMMARY]
let rpState = null;
let naSum = null;

if (safeContext.chat && Array.isArray(safeContext.chat.last_messages)) {
    const msgs = safeContext.chat.last_messages;
    for (let i = msgs.length - 1; i >= 0; i--) {
        const msgObj = msgs[i];
        if (msgObj && msgObj.message) {
            const msgText = msgObj.message;
            if (!rpState) {
                rpState = LLMUtils.decodeState(msgText, UserDefined.STATE_CIPHER_KEY);
            }
            if (!naSum) {
                naSum = LLMUtils.extractNarrationSummary(msgText);
            }
            if (rpState && naSum) break;
        }
    }
}

// Defaults
if (!rpState) {
    rpState = JSON.parse(JSON.stringify(UserDefined.defaultCharacterSheet));
}

if (!naSum) {
    naSum = {
        elapsed_time: "PT1M",
        effects: [],
        debug: {}
    };
}

// Clean Input
// Note: cleanAns is a boolean mirror of validity
const cleanAns = LLMUtils.cleanInput(naSum);

// 2. Update current_time
// Get elapsed time string. Check validity using cleanAns or just safe parse?
// cleanAns.elapsed_time is boolean. 
// If valid, use naSum value. If not, default to 0.
let durationToAdd = "PT0M";
if (cleanAns.elapsed_time) {
    durationToAdd = naSum.elapsed_time;
} else if (naSum.elapsed_time && typeof naSum.elapsed_time === 'string' && naSum.elapsed_time.indexOf('P') === 0) {
    // If validation failed but it looks like a duration?
    // Actually cleanInput validity check is strict P prefix.
    durationToAdd = naSum.elapsed_time;
} else {
    durationToAdd = "PT0M";
}

rpState.current_time = TimeUtils.addDuration(rpState.current_time, durationToAdd);

// 3. Reverse expired effects
// Using CharacterSheetUtils.reverseEffects (need to alias/add it) or revertSideEffect
if (CharacterSheetUtils.revertSideEffect) {
    rpState = CharacterSheetUtils.revertSideEffect(rpState);
}

// 4. Aspect Functions
let finalNarrationGuide = "";
const effectDefs = UserDefined.effectDefinitions;

for (let i = 0; i < effectDefs.length; i++) {
    const def = effectDefs[i];
    const key = def.key;

    // Find in naSum
    let foundEffect = null;
    let foundCleanFlags = null;

    if (naSum.effects && Array.isArray(naSum.effects)) {
        for (let j = 0; j < naSum.effects.length; j++) {
            // Check key match
            if (naSum.effects[j].key === key) {
                foundEffect = naSum.effects[j];
                // Get corresponding flags
                if (cleanAns.effects && cleanAns.effects[j]) {
                    foundCleanFlags = cleanAns.effects[j];
                }
                break;
            }
        }
    }

    if (foundEffect && foundCleanFlags) {
        // Call aspect function
        if (UserDefined.aspectFunctions && UserDefined.aspectFunctions[key]) {
            const result = UserDefined.aspectFunctions[key](rpState, foundEffect, foundCleanFlags);

            if (result) {
                if (result.narrationGuide) {
                    finalNarrationGuide += `${result.narrationGuide}\n`;
                }
                if (result.cleanedEffect) {
                    // Apply
                    rpState = CharacterSheetUtils.applySideEffect(rpState, result.cleanedEffect, rpState.current_time);
                }
            }
        }
    }
}

// 5. Encode State
const encodedStateBlock = LLMUtils.encodeState(rpState, UserDefined.STATE_CIPHER_KEY);

const systemInsts = `[SYSTEM INSTRUCTION]

{{char}}, you are a fair and impartial but also creative (lewd and smutty) Game Master (GM) of this roleplaying game (RPG). 

Based on the {{user}}'s (player's) inputs, you narrate and render the next scene of the story (MAX 300 - 400 words) while strictly adhering the following 3 rules:

1. ALWAYS start your response with the [RP_STATE] block given in this (last) instruction verbatim.
2. ALWAYS align your narration with [NARRATION_GUIDE] block. As long as you NEVER contradict or conflict with any part of it, you are free to be creative and add more details to the story.
3. ALWAYS end your response with the [NARRATION_SUMMARY] block with updated summarized information on what happened in the narration in your current response.

[/SYSTEM INSTRUCTION]

[RP_STATE] block to put at the top of your response.

[RP_STATE]
${encodedStateBlock}
[/RP_STATE]

`;

context.character.personality = systemInsts + context.character.personality;

//////////////

const narrationGuide = `

This is the narration guide for you to follow (for this response):

[NARRATION_GUIDE]
${finalNarrationGuide}
[/NARRATION_GUIDE]

**YOU MUST NEVER CONTRADICT OR CONFLICT WITH ANY PART OF THE NARRATION GUIDE.**

However, feel free to be creative and add more details to the story as long as it doesn't conflict with the narration guide.
`;

context.character.scenario = narrationGuide + context.character.scenario;

////////////

const effects = UserDefined.effectDefinitions || [];

let summaryInsts = `
At the end of your response, you MUST include the [NARRATION_SUMMARY] block with updated summarized information on what happened in the narration in your current response.

[NARRATION_SUMMARY]
{
    "elapsed_time": "An ISO 8601 duration string; e.g. PT1H30M for 1 hour and 30 minutes",
    "effects": [],
    "debug": {}
}
[/NARRATION_SUMMARY]

The "effects" array can contain instances one or more json blocks from the following list:

**[START OF EFFECT LIST]**
`;

for (const eff of effects) {
    summaryInsts += `Effect Type: ${eff.key}\n`
        + LLMUtils.generateEffectInstruction(eff) + "\n\n";
}

summaryInsts += "\n\n**[END OF EFFECT LIST]**\n\n";
summaryInsts += "**FOR EACH INSTANCE, ALWAYS INCLUDE ALL THE KEYS IN THE ABOVE JSON BLOCK**";

context.character.scenario += summaryInsts;