const XORCipher = {


    decode: function (key, input) {
        let output = "";
        for (let i = 0; i < input.length; i++) {
            const c = input.charCodeAt(i) ^ key.charCodeAt(i % key.length);
            output += String.fromCharCode(c);
        }
        return output;
    }
};


if (typeof module !== 'undefined') module.exports = XORCipher;
