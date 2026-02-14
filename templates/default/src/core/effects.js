const EffectUtils = {
    // Parse effect JSON from LLM input and return a mirror effect JSON
    // with validity flags.
    parseAndMirror: function (effect) {
        const mirror = {};
        let isValid = true;

        if (typeof effect !== 'object' || effect === null) {
            return { _valid: false, error: "Not an object" };
        }

        // Validate key
        mirror.key = effect.key;
        mirror._valid_key = (typeof effect.key === 'string' && effect.key.length > 0);
        if (!mirror._valid_key) isValid = false;

        // Validate what
        mirror.what = effect.what;
        mirror._valid_what = (typeof effect.what === 'string'); // Optional? Assuming required as per example

        // Validate temp
        mirror.temp = effect.temp;
        mirror._valid_temp = (typeof effect.temp === 'boolean');

        // Validate when
        mirror.when = effect.when;
        mirror._valid_when = TimeUtils.isValidDateStr(effect.when);
        if (!mirror._valid_when) isValid = false;

        // Validate duration
        mirror.duration = effect.duration;
        mirror._valid_duration = (typeof effect.duration === 'string' && effect.duration.indexOf('P') === 0);

        // Validate impacts
        mirror.impacts = [];
        mirror._valid_impacts = true;

        if (Array.isArray(effect.impacts)) {
            for (let i = 0; i < effect.impacts.length; i++) {
                const imp = effect.impacts[i];
                const mirrorImp = {};
                let impValid = true;

                mirrorImp.stats = imp.stats;
                mirrorImp._valid_stats = (typeof imp.stats === 'string');

                mirrorImp.op = imp.op;
                mirrorImp._valid_op = (['set', 'add', 'sub'].indexOf(imp.op) !== -1);

                mirrorImp.value = imp.value;
                mirrorImp._valid_value = (typeof imp.value === 'number');

                if (!mirrorImp._valid_stats || !mirrorImp._valid_op || !mirrorImp._valid_value) {
                    impValid = false;
                    mirror._valid_impacts = false;
                }

                mirrorImp._valid = impValid;
                mirror.impacts.push(mirrorImp);
            }
        } else {
            mirror._valid_impacts = false;
            isValid = false;
        }

        mirror._valid = isValid;
        return mirror;
    }
};


if (typeof module !== 'undefined') module.exports = EffectUtils;
