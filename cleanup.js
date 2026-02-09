const fs = require('fs');
const path = require('path');

const targetProject = process.argv[2]; // Optional project name or path

const filesToRemove = [
    'effective_script.js',
    'effective_script_min.js'
];

function cleanupDir(dir) {
    if (!fs.existsSync(dir)) {
        console.log(`Directory does not exist: ${dir}`);
        return;
    }
    console.log(`Cleaning up ${dir}...`);
    filesToRemove.forEach(file => {
        const filePath = path.join(dir, file);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`  Removed: ${file}`);
        }
    });
}

if (targetProject) {
    // If a project is specified, clean only that project
    // Handle both "my-project" and "data/my-project"
    const projectPath = targetProject.startsWith('data' + path.sep) || targetProject.startsWith('data/')
        ? path.resolve(__dirname, targetProject)
        : path.resolve(__dirname, 'data', targetProject);

    cleanupDir(projectPath);
} else {
    // Default: Cleanup everything (root + all data subfolders)
    console.log("No project specified. Cleaning all generated files...");
    cleanupDir(__dirname);

    const dataDir = path.join(__dirname, 'data');
    if (fs.existsSync(dataDir)) {
        const projects = fs.readdirSync(dataDir).filter(f => fs.statSync(path.join(dataDir, f)).isDirectory());
        projects.forEach(project => {
            cleanupDir(path.join(dataDir, project));
        });
    }
}

console.log('Cleanup complete.');
