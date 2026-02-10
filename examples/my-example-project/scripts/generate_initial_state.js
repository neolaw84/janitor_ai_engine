const fs = require('fs');
const path = require('path');

// Mock require.extensions for .txt to allow loading script_def.js
require.extensions['.txt'] = function (module, filename) {
    module.exports = fs.readFileSync(filename, 'utf8');
};

const scriptDefPath = path.resolve(__dirname, '../script_def.js');

if (!fs.existsSync(scriptDefPath)) {
    console.error(`Error: script_def.js not found at ${scriptDefPath}`);
    process.exit(1);
}

const scriptDef = require(scriptDefPath);
const config = scriptDef.config;
const defaultState = scriptDef.defaultState;

if (!config || !config.secretKey) {
    console.error('Error: config.secretKey is missing in script_def.js');
    process.exit(1);
}

if (!defaultState) {
    console.error('Error: defaultState is missing in script_def.js');
    process.exit(1);
}

// Simple Base64 polyfill for Node environment (just to match the browser logic structure)
const _btoa = (str) => Buffer.from(str, 'binary').toString('base64');

// XOR Cipher Logic (Must match src/engine/cipher.js)
const XORCipher = {
    encrypt: function (text, key) {
        try {
            let result = "";
            for (let i = 0; i < text.length; i++) {
                result += String.fromCharCode(
                    text.charCodeAt(i) ^ key.charCodeAt(i % key.length)
                );
            }
            return _btoa(result);
        } catch (e) {
            console.error("Encryption failed:", e);
            return "";
        }
    }
};

const stateString = JSON.stringify(defaultState);
const encryptedState = XORCipher.encrypt(stateString, config.secretKey);

const outputBlock = `
Copy the following block into your JanitorAI Character Definition (Initial Message or Scenario):

[SCRIPT_SECRET]${encryptedState}[/SCRIPT_SECRET]
`;

console.log(outputBlock);
