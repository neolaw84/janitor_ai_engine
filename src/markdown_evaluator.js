'use strict';

const vm = require('vm');

/**
 * Creates a restricted sandbox context for safely evaluating JavaScript.
 * Only allows: Math, Array, RegExp, and basic numeric/string globals.
 */
function createSandbox() {
    return vm.createContext({
        Math: Math,
        Array: Array,
        RegExp: RegExp,
        parseInt: parseInt,
        parseFloat: parseFloat,
        isNaN: isNaN,
        isFinite: isFinite,
        NaN: NaN,
        Infinity: Infinity,
        undefined: undefined,
        true: true,
        false: false,
    });
}

/**
 * Evaluates a JavaScript code string in a restricted sandbox and returns the
 * value of the last expression (IPython-style).
 *
 * Allowed constructs: Math, if/else if/else, arithmetic & boolean expressions,
 * comparison operators, for/while loops, arrays, and RegExp.
 *
 * @param {string} code - JavaScript code to evaluate.
 * @returns {*} The result of the last expression.
 */
function evaluateJsCode(code) {
    const sandbox = createSandbox();
    return vm.runInContext(code, sandbox, { timeout: 1000 });
}

/**
 * Given a markdown string, finds all ```javascript ... ``` code blocks,
 * evaluates each block's contents in a restricted sandbox, and replaces
 * the entire code block with the string representation of the last
 * expression value (IPython-style).
 *
 * If evaluation fails or the last expression is undefined, the code block
 * is removed (replaced with an empty string).
 *
 * @param {string} markdown - The markdown string to process.
 * @returns {string} The markdown string with JavaScript code blocks evaluated
 *   and replaced.
 */
function evaluateMarkdownCodeBlocks(markdown) {
    const codeBlockRegex = /```javascript\s*\n([\s\S]*?)```/g;
    return markdown.replace(codeBlockRegex, (match, code) => {
        try {
            const result = evaluateJsCode(code);
            if (result === undefined) {
                return '';
            }
            return String(result);
        } catch (e) {
            return '';
        }
    });
}

module.exports = { evaluateMarkdownCodeBlocks, evaluateJsCode };
