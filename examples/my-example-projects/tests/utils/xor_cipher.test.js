global.Base64 = require('../../src/utils/base64');
const XORCipher = require('../../src/utils/xor_cipher');

test('XORCipher decodes correctly', () => {
    const key = "secret";
    const msg = "hello";
    // Manually construct what encode would have done if we needed it for a test case, 
    // or just test decode logic.
    // XORCipher.decode is symmetric. 
    // key ^ msg = cipher. key ^ cipher = msg.

    // Manual encode (logic of XORCipher.decode basically)
    let encoded = "";
    for (let i = 0; i < msg.length; i++) {
        encoded += String.fromCharCode(msg.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }

    const decoded = XORCipher.decode(key, encoded);
    expect(decoded).toBe(msg);
});
