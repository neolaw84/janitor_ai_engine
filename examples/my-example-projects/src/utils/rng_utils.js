const RPMGL_RNG = {
    // Basic wrapper for Math.random
    random: function () {
        return Math.random();
    },

    // Random integer between min and max (inclusive)
    randomInt: function (min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    // Parse dice string "xdy" or "xdy+z" (e.g. "3d6", "1d20+5")
    roll: function (diceStr) {
        if (!diceStr) diceStr = "3d6";

        const parts = diceStr.toLowerCase().split('d');
        if (parts.length !== 2) return 0;

        const count = parseInt(parts[0]);
        const sidesPart = parts[1];
        let sides = 0;
        let modifier = 0;

        if (sidesPart.indexOf('+') !== -1) {
            const modParts = sidesPart.split('+');
            sides = parseInt(modParts[0]);
            modifier = parseInt(modParts[1]);
        } else if (sidesPart.indexOf('-') !== -1) {
            const modParts = sidesPart.split('-');
            sides = parseInt(modParts[0]);
            modifier = -parseInt(modParts[1]);
        } else {
            sides = parseInt(sidesPart);
        }

        if (isNaN(count) || isNaN(sides)) return 0;

        let total = 0;
        for (let i = 0; i < count; i++) {
            total += this.randomInt(1, sides);
        }

        return total + modifier;
    },

    // Roll X dice with Y sides each
    rollxdy: function (x, y) {
        if (typeof x === 'undefined') x = 3;
        if (typeof y === 'undefined') y = 6;

        let total = 0;
        for (let i = 0; i < x; i++) {
            total += this.randomInt(1, y);
        }
        return total;
    }
};


if (typeof module !== 'undefined') module.exports = RPMGL_RNG;
