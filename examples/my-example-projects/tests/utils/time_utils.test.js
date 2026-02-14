const TimeUtils = require('../../src/utils/time_utils');

test('TimeUtils parses duration correctly', () => {
    expect(TimeUtils.parseDuration("PT1H30M")).toBe(90 * 60 * 1000);
});

test('TimeUtils identifies valid date strings', () => {
    expect(TimeUtils.isValidDateStr("2023-01-01T12:00:00")).toBe(true);
    expect(TimeUtils.isValidDateStr("invalid")).toBe(false);
});

test('TimeUtils adds duration correctly', () => {
    const start = "2023-01-01T12:00:00Z";
    const added = TimeUtils.addDuration(start, "PT1H");
    // addDuration returns ISO string without milliseconds
    // 12:00Z + 1H = 13:00Z
    expect(added).toBe("2023-01-01T13:00:00"); // split('.')[0] removes Z? 
    // TimeUtils.addDuration implementation:
    // return new Date(newTime).toISOString().split('.')[0];
    // toISOString() is always YYYY-MM-DDTHH:mm:ss.sssZ
    // split('.')[0] -> YYYY-MM-DDTHH:mm:ss
    // So "2023-01-01T13:00:00" is correct.
});
