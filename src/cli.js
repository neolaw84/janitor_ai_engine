#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const inquirer = require('inquirer');
const { execSync } = require('child_process');

async function main() {
    console.log('Welcome to JanitorAI Script Scaffolder!');

    let projectName = process.argv[2];

    if (!projectName) {
        const questions = [
            {
                type: 'input',
                name: 'projectName',
                message: 'What is the name of your new project?',
                default: 'my-janitor-script',
                validate: (input) => {
                    if (/^([a-z0-9\-\_]+)$/.test(input)) return true;
                    return 'Project name may only include letters, numbers, underscores and hashes.';
                },
            },
        ];

        const answers = await inquirer.prompt(questions);
        projectName = answers.projectName;
    }

    const targetDir = path.resolve(process.cwd(), projectName);

    if (fs.existsSync(targetDir)) {
        console.error(`Error: Directory ${targetDir} already exists.`);
        process.exit(1);
    }

    console.log(`Creating project in ${targetDir}...`);

    // Path to the template directory
    // Assuming this script is run from the installed package or the root of the repo
    // __dirname is src/, so templates are in ../templates/default
    const templateDir = path.resolve(__dirname, '../templates/default');

    try {
        await fs.copy(templateDir, targetDir);

        // Update package.json
        const packageJsonPath = path.join(targetDir, 'package.json');
        if (await fs.pathExists(packageJsonPath)) {
            const packageJson = await fs.readJson(packageJsonPath);
            packageJson.name = projectName;
            packageJson.version = '0.0.1';
            packageJson.description = 'A JanitorAI script project';
            await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });
        }

        const gitignorePath = path.join(targetDir, '_gitignore');
        if (await fs.pathExists(gitignorePath)) {
            await fs.move(gitignorePath, path.join(targetDir, '.gitignore'));
        }

        const readmePath = path.join(targetDir, 'README.md');
        if (await fs.pathExists(readmePath)) {
            let readmeContent = await fs.readFile(readmePath, 'utf8');
            readmeContent = readmeContent.replace('{{PROJECT_NAME}}', projectName);
            await fs.writeFile(readmePath, readmeContent);
        }

        console.log('Project created successfully!');
        console.log(`\nTo get started:\n  cd ${projectName}\n  npm install\n  npm test\n`);
    } catch (err) {
        console.error('Error creating project:', err);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = { main }; // Export for testing if needed
