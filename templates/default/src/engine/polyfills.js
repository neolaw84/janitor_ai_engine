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
    ) {
      buffer = base64.chars.indexOf(buffer);
      if (~buffer) {
        bs = bc % 4 ? bs * 64 + buffer : buffer;
        if (bc++ % 4) {
          output += String.fromCharCode(255 & (bs >> ((-2 * bc) & 6)));
        }
      } else {
        break;
      }
    }
    return output;
  },
};

export const _btoa = typeof btoa === "function" ? btoa : base64.encode;
export const _atob = typeof atob === "function" ? atob : base64.decode;

export const XORCipher = {
  encrypt: function (text, key) {
    try {
      let result = "";
      for (let i = 0; i < text.length; i++) {
        result += String.fromCharCode(
          text.charCodeAt(i) ^ key.charCodeAt(i % key.length),
        );
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
