import { TimeManager } from "./time.js";

export function createGameState(initialState) {
  const data = JSON.parse(JSON.stringify(initialState));

  return {
    data: data,
    updateTime: function (elapsedDuration) {
      if (!elapsedDuration) return 0;

      const prevTime = new Date(this.data.current_time);
      this.data.current_time = TimeManager.addDuration(
        this.data.current_time,
        elapsedDuration,
      );
      const nextTime = new Date(this.data.current_time);

      const prevMidnight = Date.UTC(prevTime.getUTCFullYear(), prevTime.getUTCMonth(), prevTime.getUTCDate());
      const nextMidnight = Date.UTC(nextTime.getUTCFullYear(), nextTime.getUTCMonth(), nextTime.getUTCDate());

      const msPerDay = 24 * 60 * 60 * 1000;
      return Math.round((nextMidnight - prevMidnight) / msPerDay);
    },
    setEffects: function (effect) {
      if (effect.impacts) {
        for (const stat in effect.impacts) {
          if (this.data.stats[stat] !== undefined) {
            const impact = effect.impacts[stat];
            if (typeof impact === 'number') {
              this.data.stats[stat] = impact;
            }
          }
        }
      }
    },
    applyEffects: function (effect) {
      // 1. Apply Immediate Impacts
      if (effect.impacts) {
        for (const stat in effect.impacts) {
          if (this.data.stats[stat] !== undefined) {
            const impact = effect.impacts[stat];
            if (typeof impact === 'number') {
              this.data.stats[stat] += impact;
            }
          }
        }
      }

      // 2. Schedule Side Effects (Reversion)
      // Check for temp flag or existence of expiry/duration to determine if it's a temp effect
      if (effect.temp || (effect.duration && effect.duration !== "PT0M")) {
        // Calculate expiry if not present (legacy support or if passed duration)
        let expiry = effect.expiry;
        if (!expiry || expiry === "Unknown") {
          expiry = TimeManager.addDuration(
            effect.when || this.data.current_time,
            effect.duration || "PT0M"
          );
        }

        // Create a copy for storage to avoid mutation issues if object is reused
        const effectCopy = {};
        for (const key in effect) {
          effectCopy[key] = effect[key];
        }
        effectCopy.expiry = expiry;

        this.data.current_side_effects.push(effectCopy);
        this.data.current_side_effects.sort(function (a, b) {
          return new Date(a.expiry) - new Date(b.expiry);
        });

        return "Effect applied: " + (effect.what || "Unknown");
      }
      return null;
    },
    revertExpiredEffects: function () {
      const activeEffects = [];
      const revertedLog = [];

      for (let i = 0; i < this.data.current_side_effects.length; i++) {
        const effect = this.data.current_side_effects[i];
        if (TimeManager.isExpired(effect.expiry, this.data.current_time)) {
          for (const stat in effect.impacts) {
            if (this.data.stats[stat] !== undefined) {
              this.data.stats[stat] -= effect.impacts[stat];
            }
          }
          revertedLog.push("Effect expired: " + effect.what);
        } else {
          activeEffects.push(effect);
        }
      }
      this.data.current_side_effects = activeEffects;
      return revertedLog;
    },
  };
}

export function rollxdy(x, y) {
  let total = 0;
  for (let i = 0; i < x; i++) {
    total += Math.floor(Math.random() * y) + 1;
  }
  return total;
}
