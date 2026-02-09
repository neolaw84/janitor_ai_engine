const fs = require("fs");
const path = require("path");

const targetProject = process.argv[2]; // Optional project name or path

const filesToRemove = ["effective_script.js", "effective_script_min.js"];

function cleanupDir(dir) {
  if (!fs.existsSync(dir)) {
    console.log(`Directory does not exist: ${dir}`);
    return;
  }
  console.log(`Cleaning up ${dir}...`);
  filesToRemove.forEach((file) => {
    const filePath = path.join(dir, file);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`  Removed: ${file}`);
    }
  });
}

if (!targetProject) {
  console.error("Error: Please specify a project name or path to cleanup.");
  console.log("Usage: node cleanup.js <project-name>");
  process.exit(1);
}

// Handle both "my-project" and "data/my-project"
const projectPath =
  targetProject.startsWith("data" + path.sep) ||
  targetProject.startsWith("data/")
    ? path.resolve(__dirname, targetProject)
    : path.resolve(__dirname, "data", targetProject);

cleanupDir(projectPath);

console.log("Cleanup complete.");
