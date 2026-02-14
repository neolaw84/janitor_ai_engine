var CharacterSheetUtils = {
    // Apply functionality
    applySideEffect: function (sheet, effect, currentTime) {
        var newSheet = JSON.parse(JSON.stringify(sheet));

        if (!effect) return newSheet;

        var expiry = null;
        if (effect.temp && effect.duration) {
            var startTime = effect.when || currentTime;
            expiry = TimeUtils.addDuration(startTime, effect.duration);
        }

        var sideEffectEntry = {
            desc: effect.what || effect.key,
            expiry: expiry,
            impacts: []
        };

        if (effect.impacts) {
            for (var i = 0; i < effect.impacts.length; i++) {
                var imp = effect.impacts[i];
                var statKey = imp.stats;

                if (newSheet.stats && typeof newSheet.stats[statKey] !== 'undefined') {
                    var currentValue = newSheet.stats[statKey];
                    var newValue = currentValue;

                    var storedImpact = {
                        stats: statKey,
                        op: imp.op,
                        value: imp.value,
                        originalValue: currentValue
                    };

                    if (imp.op === 'set') {
                        newValue = imp.value;
                    } else if (imp.op === 'add') {
                        newValue = currentValue + imp.value;
                    } else if (imp.op === 'sub') {
                        newValue = currentValue - imp.value;
                    }

                    newSheet.stats[statKey] = newValue;
                    sideEffectEntry.impacts.push(storedImpact);
                }
            }
        }

        if (!newSheet['side-effects']) {
            newSheet['side-effects'] = [];
        }
        newSheet['side-effects'].push(sideEffectEntry);

        return newSheet;
    },

    // Revert functionality
    revertSideEffect: function (sheet) {
        var newSheet = JSON.parse(JSON.stringify(sheet));
        var currentTime = newSheet.current_time;

        if (!newSheet['side-effects']) return newSheet;

        var activeEffects = [];
        for (var i = 0; i < newSheet['side-effects'].length; i++) {
            var eff = newSheet['side-effects'][i];
            var shouldExpire = false;

            if (eff.expiry) {
                if (TimeUtils.isPast(eff.expiry, currentTime)) {
                    shouldExpire = true;
                }
            }

            if (shouldExpire) {
                if (eff.impacts) {
                    for (var j = 0; j < eff.impacts.length; j++) {
                        var imp = eff.impacts[j];
                        var statKey = imp.stats;

                        if (newSheet.stats && typeof newSheet.stats[statKey] !== 'undefined') {
                            if (imp.op === 'set') {
                                if (typeof imp.originalValue !== 'undefined') {
                                    newSheet.stats[statKey] = imp.originalValue;
                                }
                            } else if (imp.op === 'add') {
                                newSheet.stats[statKey] -= imp.value;
                            } else if (imp.op === 'sub') {
                                newSheet.stats[statKey] += imp.value;
                            }
                        }
                    }
                }
            } else {
                activeEffects.push(eff);
            }
        }

        newSheet['side-effects'] = activeEffects;
        return newSheet;
    }
};


if (typeof module !== 'undefined') module.exports = CharacterSheetUtils;
