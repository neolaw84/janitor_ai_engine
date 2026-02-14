const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../src');
const distDir = path.join(__dirname, '../dist');
const outputFile = path.join(distDir, 'bundle.js');

// Order matters!
const fileOrder = [
    'utils/base64.js',
    'utils/xor_cipher.js',
    'utils/time_utils.js',
    'utils/rng_utils.js',
    'utils/llm_utils.js',
    'core/effects.js',
    'core/character_sheet.js',
    'user_defined.js',
    'index.js'
];

function build() {
    if (!fs.existsSync(distDir)) {
        fs.mkdirSync(distDir);
    }

    let bundleContent = '';

    fileOrder.forEach(file => {
        const filePath = path.join(srcDir, file);
        if (fs.existsSync(filePath)) {
            console.log(`Adding ${file}...`);
            let content = fs.readFileSync(filePath, 'utf8');
            // Strip module.exports lines for bundle
            content = content.replace(/if \(typeof module !== 'undefined'\)[\s\S]+?module\.exports[\s\S]+?;/g, '');
            // Also strip requires if any (none yet but safe future proofing or if I added them)
            // content = content.replace(/const .* = require\(.*\);/g, '');

            bundleContent += `// --- ${file} ---\n`;
            bundleContent += content + '\n\n';
        } else {
            console.error(`Error: File not found: ${filePath}`);
            process.exit(1);
        }
    });

    fs.writeFileSync(outputFile, bundleContent);
    console.log(`Build complete! Output: ${outputFile}`);
}

build();
