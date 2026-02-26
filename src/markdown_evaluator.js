'use strict';

const acorn = require('acorn');

// ---------------------------------------------------------------------------
// Scope / environment
// ---------------------------------------------------------------------------

/**
 * A simple lexical scope that chains to a parent.
 */
class Environment {
    constructor(parent = null) {
        this.vars = new Map();
        this.parent = parent;
    }

    define(name, value) {
        this.vars.set(name, value);
    }

    set(name, value) {
        if (this.vars.has(name)) {
            this.vars.set(name, value);
            return;
        }
        if (this.parent) {
            this.parent.set(name, value);
            return;
        }
        throw new ReferenceError(`${name} is not defined`);
    }

    get(name) {
        if (this.vars.has(name)) return this.vars.get(name);
        if (this.parent) return this.parent.get(name);
        throw new ReferenceError(`${name} is not defined`);
    }
}

/** Used to propagate return values up through nested block statements. */
class ReturnSignal {
    constructor(value) { this.value = value; }
}

/** Creates the global environment with the allowed built-in identifiers. */
function createGlobalEnv() {
    const env = new Environment();
    env.define('Math', Math);
    env.define('Array', Array);
    env.define('RegExp', RegExp);
    env.define('parseInt', parseInt);
    env.define('parseFloat', parseFloat);
    env.define('isNaN', isNaN);
    env.define('isFinite', isFinite);
    env.define('NaN', NaN);
    env.define('Infinity', Infinity);
    env.define('undefined', undefined);
    return env;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Assign a value to a left-hand-side node (Identifier or MemberExpression). */
function assignTo(lhs, value, env) {
    if (lhs.type === 'Identifier') {
        env.set(lhs.name, value);
    } else if (lhs.type === 'MemberExpression') {
        const obj = evaluate(lhs.object, env);
        const prop = lhs.computed ? evaluate(lhs.property, env) : lhs.property.name;
        obj[prop] = value;
    } else {
        throw new Error(`Cannot assign to ${lhs.type}`);
    }
}

/** Apply a compound assignment operator (+=, -=, …) to two values. */
function applyAssignOp(op, l, r) {
    switch (op) {
        case '+=':   return l + r;
        case '-=':   return l - r;
        case '*=':   return l * r;
        case '/=':   return l / r;
        case '%=':   return l % r;
        case '**=':  return l ** r;
        case '&=':   return l & r;
        case '|=':   return l | r;
        case '^=':   return l ^ r;
        case '<<=':  return l << r;
        case '>>=':  return l >> r;
        case '>>>=': return l >>> r;
        default: throw new Error(`Unsupported assignment operator: ${op}`);
    }
}

// ---------------------------------------------------------------------------
// AST interpreter
// ---------------------------------------------------------------------------

/**
 * Recursively evaluates an acorn AST node inside the given environment.
 * Returns the completion value of the node (IPython-style for Program nodes).
 *
 * @param {object} node - An ESTree-format AST node produced by acorn.
 * @param {Environment} env  - The current lexical scope.
 * @returns {*} The evaluated value.
 */
function evaluate(node, env) {
    if (!node) return undefined;

    switch (node.type) {

        // -- Statements -------------------------------------------------------

        case 'Program': {
            let last = undefined;
            for (const stmt of node.body) {
                const val = evaluate(stmt, env);
                if (val instanceof ReturnSignal) return val;
                last = val;
            }
            return last;
        }

        case 'ExpressionStatement':
            return evaluate(node.expression, env);

        case 'BlockStatement': {
            const blockEnv = new Environment(env);
            let last = undefined;
            for (const stmt of node.body) {
                const val = evaluate(stmt, blockEnv);
                if (val instanceof ReturnSignal) return val;
                last = val;
            }
            return last;
        }

        case 'EmptyStatement':
            return undefined;

        case 'VariableDeclaration': {
            for (const decl of node.declarations) {
                const val = decl.init != null ? evaluate(decl.init, env) : undefined;
                env.define(decl.id.name, val);
            }
            return undefined;
        }

        case 'FunctionDeclaration': {
            const fn = makeFunction(node, env);
            env.define(node.id.name, fn);
            return undefined;
        }

        case 'IfStatement': {
            if (evaluate(node.test, env)) {
                return evaluate(node.consequent, env);
            } else if (node.alternate) {
                return evaluate(node.alternate, env);
            }
            return undefined;
        }

        case 'ForStatement': {
            // Variables declared in the init (e.g. `let i`) are scoped to the loop.
            const loopEnv = new Environment(env);
            if (node.init) evaluate(node.init, loopEnv);
            let last = undefined;
            while (!node.test || evaluate(node.test, loopEnv)) {
                const val = evaluate(node.body, loopEnv);
                if (val instanceof ReturnSignal) return val;
                last = val;
                if (node.update) evaluate(node.update, loopEnv);
            }
            return last;
        }

        case 'WhileStatement': {
            let last = undefined;
            while (evaluate(node.test, env)) {
                const val = evaluate(node.body, env);
                if (val instanceof ReturnSignal) return val;
                last = val;
            }
            return last;
        }

        case 'ReturnStatement':
            return new ReturnSignal(node.argument ? evaluate(node.argument, env) : undefined);

        // -- Expressions -------------------------------------------------------

        case 'Identifier':
            return env.get(node.name);

        case 'Literal':
            // Regex literals have a `regex` property; all others have a plain `value`.
            if (node.regex) return new RegExp(node.regex.pattern, node.regex.flags);
            return node.value;

        case 'ArrayExpression':
            return node.elements.map(el => (el ? evaluate(el, env) : undefined));

        case 'BinaryExpression': {
            const l = evaluate(node.left, env);
            const r = evaluate(node.right, env);
            switch (node.operator) {
                case '+':   return l + r;
                case '-':   return l - r;
                case '*':   return l * r;
                case '/':   return l / r;
                case '%':   return l % r;
                case '**':  return l ** r;
                case '==':  return l == r;  // intentional loose equality
                case '===': return l === r;
                case '!=':  return l != r;  // intentional loose inequality
                case '!==': return l !== r;
                case '<':   return l < r;
                case '>':   return l > r;
                case '<=':  return l <= r;
                case '>=':  return l >= r;
                case '&':   return l & r;
                case '|':   return l | r;
                case '^':   return l ^ r;
                case '<<':  return l << r;
                case '>>':  return l >> r;
                case '>>>': return l >>> r;
                default: throw new Error(`Unsupported binary operator: ${node.operator}`);
            }
        }

        case 'LogicalExpression': {
            const l = evaluate(node.left, env);
            if (node.operator === '&&') return l ? evaluate(node.right, env) : l;
            if (node.operator === '||') return l ? l : evaluate(node.right, env);
            if (node.operator === '??') return l != null ? l : evaluate(node.right, env);
            throw new Error(`Unsupported logical operator: ${node.operator}`);
        }

        case 'UnaryExpression': {
            // `typeof x` should not throw when x is undeclared.
            if (node.operator === 'typeof' && node.argument.type === 'Identifier') {
                try { return typeof env.get(node.argument.name); }
                catch (_) { return 'undefined'; }
            }
            const arg = evaluate(node.argument, env);
            switch (node.operator) {
                case '!':      return !arg;
                case '-':      return -arg;
                case '+':      return +arg;
                case '~':      return ~arg;
                case 'typeof': return typeof arg;
                case 'void':   return void arg;
                default: throw new Error(`Unsupported unary operator: ${node.operator}`);
            }
        }

        case 'UpdateExpression': {
            const cur = evaluate(node.argument, env);
            const next = node.operator === '++' ? cur + 1 : cur - 1;
            assignTo(node.argument, next, env);
            return node.prefix ? next : cur;
        }

        case 'AssignmentExpression': {
            const rhs = node.operator === '='
                ? evaluate(node.right, env)
                : applyAssignOp(node.operator, evaluate(node.left, env), evaluate(node.right, env));
            assignTo(node.left, rhs, env);
            return rhs;
        }

        case 'MemberExpression': {
            const obj = evaluate(node.object, env);
            const prop = node.computed ? evaluate(node.property, env) : node.property.name;
            return obj[prop];
        }

        case 'CallExpression': {
            let fn, thisVal;
            if (node.callee.type === 'MemberExpression') {
                thisVal = evaluate(node.callee.object, env);
                const method = node.callee.computed
                    ? evaluate(node.callee.property, env)
                    : node.callee.property.name;
                fn = thisVal[method];
            } else {
                thisVal = undefined;
                fn = evaluate(node.callee, env);
            }
            if (typeof fn !== 'function') {
                const name = node.callee.type === 'Identifier' ? node.callee.name : '(value)';
                throw new TypeError(`${name} is not a function`);
            }
            // Block Function constructor to prevent indirect code execution.
            if (fn === Function) {
                throw new Error('Function constructor is not allowed');
            }
            const args = node.arguments.map(arg => evaluate(arg, env));
            return fn.apply(thisVal, args);
        }

        case 'ArrowFunctionExpression':
        case 'FunctionExpression':
            return makeFunction(node, env);

        case 'NewExpression': {
            const ctor = evaluate(node.callee, env);
            // Block Function constructor to prevent indirect code execution.
            if (ctor === Function) {
                throw new Error('Function constructor is not allowed');
            }
            const args = node.arguments.map(arg => evaluate(arg, env));
            return new ctor(...args);
        }

        case 'ConditionalExpression':
            return evaluate(node.test, env)
                ? evaluate(node.consequent, env)
                : evaluate(node.alternate, env);

        case 'SequenceExpression': {
            let last;
            for (const expr of node.expressions) last = evaluate(expr, env);
            return last;
        }

        case 'TemplateLiteral': {
            let result = '';
            for (let i = 0; i < node.quasis.length; i++) {
                result += node.quasis[i].value.cooked;
                if (i < node.expressions.length) {
                    result += String(evaluate(node.expressions[i], env));
                }
            }
            return result;
        }

        default:
            throw new Error(`Unsupported AST node type: ${node.type}`);
    }
}

/** Builds a callable JavaScript function from a function/arrow-function AST node. */
function makeFunction(node, capturedEnv) {
    const params = node.params.map(p => {
        if (p.type !== 'Identifier') {
            throw new Error(`Unsupported parameter type: ${p.type}`);
        }
        return p.name;
    });
    return function (...args) {
        const fnEnv = new Environment(capturedEnv);
        params.forEach((p, i) => fnEnv.define(p, args[i]));
        // Arrow functions with an expression body (not a block) return the expression.
        if (node.body.type !== 'BlockStatement') {
            return evaluate(node.body, fnEnv);
        }
        const result = evaluate(node.body, fnEnv);
        // Unwrap any ReturnSignal propagated up from a return statement.
        if (result instanceof ReturnSignal) return result.value;
        return result;
    };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Evaluates a JavaScript code string using a built-in AST-walking interpreter
 * (no eval, no vm, no Function constructor) and returns the value of the last
 * expression (IPython-style).
 *
 * Allowed constructs: Math, if/else if/else, arithmetic & boolean expressions,
 * comparison operators, for/while loops, arrays, and RegExp.
 *
 * @param {string} code - JavaScript code to evaluate.
 * @returns {*} The result of the last expression.
 */
function evaluateJsCode(code) {
    const ast = acorn.parse(code, { ecmaVersion: 2020 });
    return evaluate(ast, createGlobalEnv());
}

/**
 * Given a markdown string, finds all ```javascript ... ``` code blocks,
 * evaluates each block's contents using the built-in interpreter, and replaces
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
            if (result === undefined) return '';
            return String(result);
        } catch (e) {
            return '';
        }
    });
}

module.exports = { evaluateMarkdownCodeBlocks, evaluateJsCode };
