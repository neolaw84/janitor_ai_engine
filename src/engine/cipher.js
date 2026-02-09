import { _btoa, _atob } from './polyfills';

export const XORCipher = {
    encrypt: function (text, key) {
        try {
            let result = "";
            for (let i = 0; i < text.length; i++) {
                result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
            }
            return _btoa(result);
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
                result += String.fromCharCode(decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length));
            }
            return result;
        } catch (e) {
            console.error("Decryption failed:", e);
            return null;
        }
    }
};
