import { TimeManager } from "./time";

export function createGameState(initialState) {
  const data = JSON.parse(JSON.stringify(initialState));

  return {
    data: data,
    updateTime: function (elapsedDuration) {
      if (elapsedDuration) {
        this.data.current_time = TimeManager.addDuration(
          this.data.current_time,
          elapsedDuration,
        );
      }
    },
    applySideEffect: function (effect) {
      const expiry = TimeManager.addDuration(
        this.data.current_time,
        effect.duration || "PT0M",
      );

      for (const stat in effect.impacts) {
        if (this.data.stats[stat] !== undefined) {
          this.data.stats[stat] += effect.impacts[stat];
        }
      }

      const effectCopy = {};
      for (const key in effect) {
        effectCopy[key] = effect[key];
      }
      effectCopy.expiry = expiry;

      this.data.current_side_effects.push(effectCopy);
      this.data.current_side_effects.sort(function (a, b) {
        return new Date(a.expiry) - new Date(b.expiry);
      });
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
