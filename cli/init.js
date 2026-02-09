const fs = require('fs');
const path = require('path');

const projectName = process.argv[2];

if (!projectName) {
    console.error("Usage: npm run init <project_name>");
    process.exit(1);
}

const projectDir = path.resolve(__dirname, '..', 'data', projectName);

if (fs.existsSync(projectDir)) {
    console.error(`Error: Project directory ${projectDir} already exists.`);
    process.exit(1);
}

console.log(`Creating project: ${projectName} at ${projectDir}`);

// Create directory
fs.mkdirSync(projectDir, { recursive: true });

// Load Template
const templatePath = path.resolve(__dirname, '..', 'templates', 'script_def_template.js');
let defaultDef = fs.readFileSync(templatePath, 'utf8');

// Generate Secret
const secretKey = `SECRET_${projectName.toUpperCase()}_${Math.floor(Math.random() * 1000)}`;

// Inject
defaultDef = defaultDef.replace("/*__PROJECT_SECRET_KEY__*/", secretKey);

// Default README.md
const defaultReadme = `# Project: ${projectName}

## Development
1. Edit \`script_def.js\` to define your state and logic.
2. Build the script:
   \`\`\`bash
   npm run build -- ${projectName}
   \`\`\`
   or 
   \`\`\`bash
   npm run build -- data/${projectName}
   \`\`\`
   *(ensure the path resolves correctly)*

## Deployment
Copy \`effective_script.js\` (minified usually preferred but not strictly required by this toolchain settings yet) to JanitorAI.
`;

fs.writeFileSync(path.join(projectDir, 'script_def.js'), defaultDef);
fs.writeFileSync(path.join(projectDir, 'README.md'), defaultReadme);

console.log(`Project ${projectName} initialized.`);
console.log(`Next steps:`);
console.log(`1. Edit data/${projectName}/script_def.js`);
console.log(`2. npm run build -- data/${projectName}`);
