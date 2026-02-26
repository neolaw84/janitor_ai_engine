'use strict';

const { evaluateMarkdownCodeBlocks, evaluateJsCode } = require('../src/markdown_evaluator');

let passed = 0;
let failed = 0;

function assert(condition, message) {
    if (condition) {
        console.log(`  PASS: ${message}`);
        passed++;
    } else {
        console.error(`  FAIL: ${message}`);
        failed++;
    }
}

function assertEqual(actual, expected, message) {
    if (actual === expected) {
        console.log(`  PASS: ${message}`);
        passed++;
    } else {
        console.error(`  FAIL: ${message}\n       Expected: ${JSON.stringify(expected)}\n       Actual:   ${JSON.stringify(actual)}`);
        failed++;
    }
}

console.log('\nRunning markdown_evaluator tests...\n');

// --- evaluateJsCode ---

console.log('evaluateJsCode: arithmetic expressions');
assertEqual(evaluateJsCode('1 + 2'), 3, 'simple addition');
assertEqual(evaluateJsCode('10 - 3 * 2'), 4, 'operator precedence');
assertEqual(evaluateJsCode('2 ** 8'), 256, 'exponentiation');

console.log('\nevaluateJsCode: boolean and comparison');
assertEqual(evaluateJsCode('3 > 2'), true, 'greater than');
assertEqual(evaluateJsCode('1 === 1'), true, 'strict equality');
assertEqual(evaluateJsCode('true && false'), false, 'logical AND');
assertEqual(evaluateJsCode('true || false'), true, 'logical OR');
assertEqual(evaluateJsCode('!true'), false, 'logical NOT');

console.log('\nevaluateJsCode: Math');
assertEqual(evaluateJsCode('Math.sqrt(16)'), 4, 'Math.sqrt');
assertEqual(evaluateJsCode('Math.pow(2, 10)'), 1024, 'Math.pow');
assertEqual(evaluateJsCode('Math.floor(3.7)'), 3, 'Math.floor');
assertEqual(evaluateJsCode('Math.abs(-5)'), 5, 'Math.abs');

console.log('\nevaluateJsCode: if/else');
assertEqual(evaluateJsCode('let x = 5; if (x > 3) { x = 10; } x;'), 10, 'if sets variable');
assertEqual(evaluateJsCode('let x = 1; if (x > 3) { x = 10; } else { x = 0; } x;'), 0, 'else branch');
assertEqual(
    evaluateJsCode('let x = 2; if (x > 3) { x = 10; } else if (x === 2) { x = 99; } else { x = 0; } x;'),
    99,
    'else if branch'
);

console.log('\nevaluateJsCode: loops');
assertEqual(
    evaluateJsCode('let sum = 0; for (let i = 1; i <= 5; i++) { sum += i; } sum;'),
    15,
    'for loop sum 1..5'
);
assertEqual(
    evaluateJsCode('let n = 1; let count = 0; while (n < 32) { n *= 2; count++; } count;'),
    5,
    'while loop'
);

console.log('\nevaluateJsCode: arrays');
assertEqual(evaluateJsCode('[1, 2, 3].length'), 3, 'array literal length');
assertEqual(evaluateJsCode('[1, 2, 3].reduce((a, b) => a + b, 0)'), 6, 'array reduce');
assertEqual(
    evaluateJsCode('let arr = [3, 1, 2]; arr.sort((a, b) => a - b); arr[0];'),
    1,
    'array sort first element'
);

console.log('\nevaluateJsCode: RegExp');
assertEqual(evaluateJsCode('/hello/.test("hello world")'), true, 'regex test true');
assertEqual(evaluateJsCode('/hello/.test("goodbye")'), false, 'regex test false');
assertEqual(evaluateJsCode('"hello world".match(/\\w+/)[0]'), 'hello', 'string match');

console.log('\nevaluateJsCode: last expression behaviour');
// Declaration as last statement returns undefined
assertEqual(evaluateJsCode('let x = 42;'), undefined, 'declaration returns undefined');
// Last expression wins
assertEqual(evaluateJsCode('let x = 5; let y = 10; x + y;'), 15, 'last expression is x + y');

// --- evaluateMarkdownCodeBlocks ---

console.log('\nevaluateMarkdownCodeBlocks: basic replacement');
const md1 = 'Result:\n```javascript\n1 + 1\n```\nEnd.';
assertEqual(evaluateMarkdownCodeBlocks(md1), 'Result:\n2\nEnd.', 'single block replaced with result');

console.log('\nevaluateMarkdownCodeBlocks: multiple blocks');
const md2 = '```javascript\n2 + 2\n```\nand\n```javascript\n3 * 3\n```';
assertEqual(evaluateMarkdownCodeBlocks(md2), '4\nand\n9', 'two blocks both replaced');

console.log('\nevaluateMarkdownCodeBlocks: last expression with variables');
const md3 = '```javascript\nlet x = 7;\nx * 6;\n```';
assertEqual(evaluateMarkdownCodeBlocks(md3), '42', 'variable usage last expression');

console.log('\nevaluateMarkdownCodeBlocks: undefined last expression');
const md4 = '```javascript\nlet x = 10;\n```';
assertEqual(evaluateMarkdownCodeBlocks(md4), '', 'undefined result replaced with empty string');

console.log('\nevaluateMarkdownCodeBlocks: null last expression');
const md4b = '```javascript\nnull\n```';
assertEqual(evaluateMarkdownCodeBlocks(md4b), 'null', 'null result becomes string "null"');

console.log('\nevaluateMarkdownCodeBlocks: Math in block');
const md5 = '```javascript\nMath.max(3, 7, 2)\n```';
assertEqual(evaluateMarkdownCodeBlocks(md5), '7', 'Math.max in block');

console.log('\nevaluateMarkdownCodeBlocks: loop in block');
const md6 = '```javascript\nlet s = 0; for (let i = 0; i < 4; i++) { s += i; } s;\n```';
assertEqual(evaluateMarkdownCodeBlocks(md6), '6', 'for loop result');

console.log('\nevaluateMarkdownCodeBlocks: non-js code blocks are untouched');
const md7 = '```python\nprint("hello")\n```';
assertEqual(evaluateMarkdownCodeBlocks(md7), '```python\nprint("hello")\n```', 'python block unchanged');

console.log('\nevaluateMarkdownCodeBlocks: error handling');
const md8 = '```javascript\nthis_will_throw_an_error()\n```';
assertEqual(evaluateMarkdownCodeBlocks(md8), '', 'error results in empty string');

console.log('\nevaluateMarkdownCodeBlocks: surrounding text preserved');
const md9 = '# Title\n\nSome text.\n\n```javascript\n10 / 2\n```\n\nMore text.';
assertEqual(
    evaluateMarkdownCodeBlocks(md9),
    '# Title\n\nSome text.\n\n5\n\nMore text.',
    'surrounding markdown preserved'
);

// --- sandbox restrictions ---

console.log('\nevaluateJsCode: sandbox prevents access to dangerous globals');
let threw = false;
try { evaluateJsCode('process.exit(1)'); } catch (e) { threw = true; }
assert(threw, 'process is not accessible');

threw = false;
try { evaluateJsCode('require("fs")'); } catch (e) { threw = true; }
assert(threw, 'require is not accessible');

// Summary
console.log(`\n${passed} passed, ${failed} failed.`);
if (failed > 0) {
    process.exit(1);
}
