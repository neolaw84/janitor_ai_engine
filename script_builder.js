const fs = require('fs');
const path = require('path');

const projectDir = process.argv[2] || '.';
const configPath = path.resolve(projectDir, 'script_def.js');
const templatePath = path.resolve(__dirname, 'templates', 'foundation_template.js');
const outputPath = path.resolve(projectDir, 'effective_script.js');
const minOutputPath = path.resolve(projectDir, 'effective_script_min.js');

console.log(`Using project directory: ${projectDir}`);

// Load Config
const userConfig = require(configPath);

// Load Template
const template = fs.readFileSync(templatePath, 'utf8');

// Serialize Data and Functions to Strings
const defaultStateStr = JSON.stringify(userConfig.defaultState, null, 2);
const secretKeyStr = userConfig.config.secretKey;
const summaryTemplateStr = JSON.stringify(userConfig.summaryTemplate || {}, null, 2);

// Standardized Functions serialization
let stdFunctionsStr = "[\n";
if (userConfig.standardizedFunctions && Array.isArray(userConfig.standardizedFunctions)) {
    for (let i = 0; i < userConfig.standardizedFunctions.length; i++) {
        stdFunctionsStr += "    " + userConfig.standardizedFunctions[i].toString() + ",\n";
    }
}
stdFunctionsStr += "]";

// Inject
let script = template;
script = script.replace(/\/\*__CONFIG_SECRET_KEY__\*\//g, secretKeyStr);
script = script.replace(/\/\*__CONFIG_DEFAULT_STATE__\*\//g, defaultStateStr);
script = script.replace(/\/\*__CONFIG_SUMMARY_TEMPLATE__\*\//g, summaryTemplateStr);
script = script.replace(/\/\*__CONFIG_STANDARDIZED_FUNCTIONS__\*\//g, stdFunctionsStr);

// Write Main Script
fs.writeFileSync(outputPath, script);
console.log(`Generated: ${outputPath}`);

// Minification (Regex based)
function minify(code) {
    // 1. Remove single-line comments // ...
    code = code.replace(/\/\/[^\n]*\n/g, '\n');
    // 2. Remove multi-line comments /* ... */
    code = code.replace(/\/\*[\s\S]*?\*\//g, '');
    // 3. Normalize whitespace
    code = code.replace(/\s+/g, ' ');
    // 4. Remove space around punctuation
    code = code.replace(/\s*([=+\-*/{}();,<>])\s*/g, '$1');
    return code.trim();
}

const minified = minify(script);
fs.writeFileSync(minOutputPath, minified);
console.log(`Generated Minified: ${minOutputPath} (Size: ${minified.length} bytes)`);
