const fs = require('fs');
const path = require('path');

const projectName = process.argv[2];

if (!projectName) {
    console.error("Usage: node project_init.js <project_name>");
    process.exit(1);
}

const projectDir = path.resolve(__dirname, 'data', projectName);

if (fs.existsSync(projectDir)) {
    console.error(`Error: Project directory ${projectDir} already exists.`);
    process.exit(1);
}

console.log(`Creating project: ${projectName} at ${projectDir}`);

// Create directory
fs.mkdirSync(projectDir, { recursive: true });

// Default script_def.js
const defaultDef = `module.exports = {
    config: {
        secretKey: "SECRET_${projectName.toUpperCase()}_${Math.floor(Math.random() * 1000)}", 
    },
    defaultState: {
        inventory: [],
        stats: {
            health: 100,
            gold: 0
        },
        current_side_effects: [],
        current_time: "2025-01-01T12:00:00Z",
        turn_count: 0
    },
    updateState: function (state, summary) {
        if (summary.elapsed_duration) {
            state.updateTime(summary.elapsed_duration);
        }
        
        if (summary.gained_gold) {
            state.data.stats.gold += summary.gained_gold;
        }
    },
    generateWhatHappen: function (state) {
        let text = "Current Time: " + state.data.current_time + "\\n";
        text += "Gold: " + state.data.stats.gold + "\\n";
        text += "Inventory: " + (state.data.inventory.length ? state.data.inventory.join(", ") : "Empty") + "\\n";
        return text;
    }
};
`;

// Default README.md
const defaultReadme = `# Project: ${projectName}

## Development
1. Edit \`script_def.js\` to define your state and logic.
2. Build the script:
   \`\`\`bash
   node script_builder.js data/${projectName}
   \`\`\`
3. Test the script:
   \`\`\`bash
   node test_harness.js data/${projectName}
   \`\`\`

## Deployment
Copy \`effective_script_min.js\` to JanitorAI.
`;

fs.writeFileSync(path.join(projectDir, 'script_def.js'), defaultDef);
fs.writeFileSync(path.join(projectDir, 'README.md'), defaultReadme);

console.log(`Project ${projectName} initialized.`);
console.log(`Next steps:`);
console.log(`1. cd into the project or edit data/${projectName}/script_def.js`);
console.log(`2. node script_builder.js data/${projectName}`);
