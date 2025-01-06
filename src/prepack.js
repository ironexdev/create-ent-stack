import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

// Resolve __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define the clone URL and local destination
const GIT_REPO_URL = "git@github.com:ironexdev/ent-stack.git";
const sourceDir = path.resolve(__dirname, "../source");

// Ensure the source directory does not already exist (optional safety check)
if (fs.existsSync(sourceDir)) {
  console.warn(`Warning: The directory ${sourceDir} already exists. Removing it...`);
  fs.rmSync(sourceDir, { recursive: true, force: true });
}

// Ensure the source directory now exists (it won't yet, but just to illustrate a pattern)
ensureDirSync(sourceDir);

// Clone the repository into the source directory
try {
  console.log(`Cloning ${GIT_REPO_URL} into ${sourceDir}...`);
  execSync(`git clone ${GIT_REPO_URL} ${sourceDir}`, { stdio: "inherit" });
  console.log("Clone successful!");
} catch (error) {
  console.error(`Error cloning ${GIT_REPO_URL}:`, error);
  process.exit(1);
}

// Remove the .git folder
const gitDir = path.join(sourceDir, ".git");

if (fs.existsSync(gitDir)) {
  fs.rmSync(gitDir, { recursive: true, force: true });
  console.log(`Removed ${gitDir}`);
} else {
  console.warn(`.git directory not found in ${sourceDir}`);
}


// Helper function to ensure a directory exists
function ensureDirSync(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}
