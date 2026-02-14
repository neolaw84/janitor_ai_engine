const RPMGL_RNG = require('../../src/utils/rng_utils');

test('RNG rolls 3d6 in range', () => {
    for (let i = 0; i < 100; i++) {
        const roll = RPMGL_RNG.rollxdy(3, 6);
        expect(roll).toBeGreaterThanOrEqual(3);
        expect(roll).toBeLessThanOrEqual(18);
    }
});
