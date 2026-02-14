const Base64 = require('../../src/utils/base64');

test('Base64 encodes raw strings correctly', () => {
    // "hello" -> "aGVsbG8="
    expect(Base64.encodeRaw("hello")).toBe("aGVsbG8=");
});

test('Base64 decodes raw strings correctly', () => {
    // "aGVsbG8=" -> "hello"
    expect(Base64.decodeRaw("aGVsbG8=")).toBe("hello");
});
