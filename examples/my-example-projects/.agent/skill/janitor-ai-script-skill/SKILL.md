---
name: Janitor AI Script Development
description: Guidelines and patterns for developing scripts for the Janitor AI sandbox environment (strictly secured, vanilla JS, no modules).
---

# Janitor AI Script Development

This skill provides guidelines for developing scripts for the Janitor AI sandbox environment. This environment is strictly secured and heavily constrained.

## Environment Constraints

*   **No Modules**: The environment does not support ES modules (`import`/`export`) or CommonJS (`require`). All code must run in a single global scope or be concatenated into a single file.
*   **No Standard Build Outputs**: Standard Webpack/Rollup bundles often include "safe" code that breaks this sandbox (e.g., `eval`, `new Function`, specific module boilerplate). A custom concatenation build is required.
*   **Restricted Globals**: `btoa`, `atob`, `setTimeout`, `setInterval`, `fetch`, and `Promise` are strictly forbidden or unavailable.

## JavaScript Restrictions

Adhere strictly to these lists. The sandbox supports a specific subset of ES5/ES6.

### 🟡 Safe Tools (Always Work)

**Variables**
*   `const`
*   `let`

**Text**
*   `toLowerCase()`
*   `indexOf("word") !== -1`
*   `trim()`
*   Template strings: `` `Hello ${name}` ``

**Numbers & Math**
*   `+`, `-`, `*`, `/`
*   `Math.random()`
*   `Math.floor()`

**Arrays**
*   `arr.length`
*   `arr.indexOf("thing")`
*   `for` loops (Use these instead of array methods)

**Dates**
*   `new Date().getHours()`
*   ISO 8601 parsing must be done manually or with strictly safe regex.

**Regex**
*   `/\bword\b/i.test(text)`

**Debugging**
*   `console.log("Message:", value);`

### 🟡 Unsafe Tools (Never Work)

**Do NOT use these:**
*   Array Iterators: `.map()`, `.filter()`, `.reduce()`, `.forEach()`
*   Arrow functions: `() => {}`
*   Spread operator: `...`
*   Async: `async`/`await`, `Promise`
*   Classes: `class MyClass {}`
*   Error Handling: `try`/`catch` (Errors often cannot be caught safely or cause instant termination)
*   Timers: `setTimeout`, `setInterval`
*   Network: `fetch`, `XMLHttpRequest`
*   Modern String Methods: `.includes()`, `.repeat()`, `.padStart()`, `.padEnd()`

## Project Structure Pattern

Recommended structure for manageable development with modern tooling:

```
project/
├── src/
│   ├── utils/       # Helper functions (Base64, Time, RNG)
│   ├── core/        # Logic (Character Sheet, Effects)
│   └── index.js     # Entry point (conceptual)
├── scripts/
│   ├── build.js     # Custom concatenation script
│   └── verify_bundle.js # Post-build verification script
├── dist/            # Output directory (bundle.js)
└── tests/           # Unit tests (Jest)
```

## Build System Pattern (Concatenation & Stripping)

Since modules are forbidden in the sandbox but essential for testing, we use a **Hybrid Development Pattern**:
1.  **Develop** using standard Node.js `module.exports` for unit testing.
2.  **Build** using a script that concatenates files AND **strips** the `module.exports` lines.

**`scripts/build.js` Example:**

```javascript
const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../src');
const outputFile = path.join(__dirname, '../dist/bundle.js');

// Order matters! Dependencies first.
const fileOrder = [
    'utils/base64.js',
    'utils/time_utils.js',
    'core/logic.js',
    'main.js'
];

let bundleContent = '';
fileOrder.forEach(file => {
    let content = fs.readFileSync(path.join(srcDir, file), 'utf8');
    
    // STRIP module.exports for sandbox compatibility
    content = content.replace(/if \(typeof module !== 'undefined'\)[\s\S]+?module\.exports[\s\S]+?;/g, '');
    
    bundleContent += `// --- ${file} ---\n${content}\n\n`;
});

fs.writeFileSync(outputFile, bundleContent);
```

## Testing & Quality Assurance

To ensure robustness without relying on `eval` hacks for primary logic validation:

### 1. Unit Testing (Jest)
Use `jest` to test individual modules. To make source files testable in Node.js without breaking the sandbox, add a **Conditional Export** at the end of each file:

```javascript
// src/utils/my_util.js
const MyUtil = { ... };

// Conditional export: ignored by browser/sandbox, used by Jest
if (typeof module !== 'undefined') module.exports = MyUtil;
```

### 2. Integration Verification
Use a post-build script (`scripts/verify_bundle.js`) to load the final `dist/bundle.js` into a mock context (using `eval` or `vm`) to ensure:
1.  The build process correctly stripped exports.
2.  The concatenated code runs without syntax errors.
3.  Global variables are accessible as expected.

## Common Utilities

You will likely need custom implementations for standard features missing in the sandbox.

### Base64 (No `btoa`/`atob`)
Implement a custom Base64 object with `encode` and `decode` methods using a lookup string (`ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=`) and bitwise operations.

### Time & Duration
*   Use ISO 8601 strings (`yyyy-mm-ddTHH:MM:SS`) for time.
*   Use ISO 8601 duration strings (`PT1H30M`) for intervals.
*   Implement parsing logic manually (regex matching `P...T...`) to convert to milliseconds.

### RNG
*   Wrap `Math.random()`.
*   Implement dice rolling (`rollxdy`) by parsing "XdY" strings.
