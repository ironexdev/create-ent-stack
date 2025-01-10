#!/usr/bin/env node

import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Validate the command line arguments
if (process.argv.length < 3) {
  console.error(
    "Version argument is missing: ts-node updateVersion.ts <semver>",
  )
  process.exit(1)
}

const version = process.argv[2]!
const semverRegex = /^\d+\.\d+\.\d+$/

if (!semverRegex.test(version)) {
  console.error("Invalid version format. Must be a valid semver (e.g., 1.2.3).")
  process.exit(1)
}

// Adjust file paths relative to the script's parent directory
const baseDir = path.join(__dirname, "..")
const entStackVersionPath = path.join(baseDir, "src", "ent-stack-version.txt")
const readmePath = path.join(baseDir, "README.md")

// Update src/ent-stack-version.txt
try {
  fs.writeFileSync(entStackVersionPath, version, "utf-8")
  console.log(`Updated ${entStackVersionPath} with version ${version}`)
} catch (err) {
  console.error(`Failed to update ${entStackVersionPath}:`, err)
  process.exit(1)
}

// Update README.md
try {
  const readmeContent = fs.readFileSync(readmePath, "utf-8")
  const updatedReadmeContent = readmeContent.replace(
    /tagged with \*\*([^*]+)\*\*/,
    `tagged with **${version}**`,
  )

  fs.writeFileSync(readmePath, updatedReadmeContent, "utf-8")
  console.log(`Updated ${readmePath} with version ${version}`)
} catch (err) {
  console.error(`Failed to update ${readmePath}:`, err)
  process.exit(1)
}
