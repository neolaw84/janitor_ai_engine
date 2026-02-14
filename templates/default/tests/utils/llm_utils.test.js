global.Base64 = require('../../src/utils/base64');
global.XORCipher = require('../../src/utils/xor_cipher');
global.TimeUtils = require('../../src/utils/time_utils');
const LLMUtils = require('../../src/utils/llm_utils');

test('LLMUtils cleans input correctly', () => {
    const input = {
        elapsed_time: "PT1H",
        effects: [
            { key: "test", what: "thing", temp: true, when: "2023-01-01T12:00:00", duration: "PT1H", impacts: [] },
            { key: "bad", temp: "string" }
        ],
        debug: {}
    };
    const cleaned = LLMUtils.cleanInput(input);
    
    expect(cleaned.elapsed_time).toBe(true);
    expect(cleaned.effects[0].key).toBe(true);
    expect(cleaned.effects[0].temp).toBe(true);
    expect(cleaned.effects[1].temp).toBe(false);
});

test('LLMUtils encodes and decodes state', () => {
    const key = "secret";
    const sheet = { stats: { strength: 10 } };
    const instruction = LLMUtils.encodeState(sheet, key);
    
    expect(instruction).toContain("[RP_STATE]");
    
    // Simulate finding it in message
    const msg = `Output: ${instruction}`;
    const decoded = LLMUtils.decodeState(msg, key);
    
    expect(decoded).toEqual(sheet);
});
