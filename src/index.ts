#!/usr/bin/env node

import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import readline from "readline/promises"
import { stdin as input, stdout as output } from "process"
import chalk from "chalk"
import { ensureDirSync, generateJWTSecret } from "./utils.js"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

await main()

async function main() {
  // Regex for package.json "name" validation
  const packageNameRegex = new RegExp(
    "^(?:@(?:[a-z0-9-*~][a-z0-9-*._~]*)?/)?[a-z0-9-~][a-z0-9-._~]*$",
  )

  // Create a readline interface
  const rl = readline.createInterface({ input, output })

  // Prompt for a valid project name
  let projectName
  while (true) {
    projectName = await rl.question(
      chalk.hex("#B8B9FF")("Enter your project name: "),
    )
    if (packageNameRegex.test(projectName)) {
      break // Valid input — break out of the loop
    }
    console.log(
      chalk.red(
        `Project name must match package.json "name" criteria:\n${packageNameRegex.source}`,
      ),
    )
  }

  // Close readline
  await rl.close()

  // Resolve the path to the new project directory
  const resolvedPath = path.resolve(projectName)
  ensureDirSync(resolvedPath)

  // Copy "source" directory
  const sourceDir = path.join(__dirname, "source")
  try {
    copyRecursiveSync(sourceDir, resolvedPath)
    console.log(chalk.green(`Source directory copied to: ${resolvedPath}`))
  } catch (error) {
    console.error(chalk.red("Error copying source directory:"), error)
    process.exit(1)
  }

  // Rename all keep.gitignore files to .gitignore
  renameKeepGitignoreFiles(resolvedPath)

  // Modify the scaffolded package.json
  const packageJsonPath = path.join(resolvedPath, "package.json")

  if (fs.existsSync(packageJsonPath)) {
    try {
      const packageJsonData = fs.readFileSync(packageJsonPath, "utf-8")
      const packageJson = JSON.parse(packageJsonData)

      // Update name and version
      packageJson.name = projectName
      packageJson.version = "0.0.1"
      delete packageJson.author
      delete packageJson.license
      delete packageJson.description

      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2))
    } catch (error) {
      console.log(chalk.red("Error updating package.json:"), error)
    }
  }

  // Modify the scaffolded .env files
  const backendEnvPath = path.join(resolvedPath, "apps/backend/.env")
  const frontendEnvPath = path.join(resolvedPath, "apps/frontend/.env")

  // Generate JWT secret
  const jwtSecret = generateJWTSecret(32)

  // Set backend .env values
  if (fs.existsSync(backendEnvPath)) {
    try {
      let backendEnvContent = fs.readFileSync(backendEnvPath, "utf-8")
      backendEnvContent = backendEnvContent.replace(
        /SITE_NAME=.*/,
        `SITE_NAME=${projectName}`,
      )
      backendEnvContent = backendEnvContent.replace(
        /JWT_SECRET=.*/,
        `JWT_SECRET=${jwtSecret}`,
      )
      fs.writeFileSync(backendEnvPath, backendEnvContent)
    } catch (error) {
      console.log(chalk.red("Error setting SITE_NAME in backend .env:"), error)
    }
  }

  // Set frontend .env values
  if (fs.existsSync(frontendEnvPath)) {
    try {
      let frontendEnvContent = fs.readFileSync(frontendEnvPath, "utf-8")
      frontendEnvContent = frontendEnvContent.replace(
        /NEXT_PUBLIC_SITE_NAME=.*/,
        `NEXT_PUBLIC_SITE_NAME=${projectName}`,
      )
      frontendEnvContent = frontendEnvContent.replace(
        /JWT_SECRET=.*/,
        `JWT_SECRET=${jwtSecret}`,
      )
      fs.writeFileSync(frontendEnvPath, frontendEnvContent)
    } catch (error) {
      console.log(chalk.red("Error setting SITE_NAME in frontend .env:"), error)
    }
  }

  // Modify the scaffolded manifest.ts
  const manifestPath = path.join(
    resolvedPath,
    "apps/frontend/src/app/manifest.ts",
  )

  if (fs.existsSync(manifestPath)) {
    try {
      let manifestContent = fs.readFileSync(manifestPath, "utf-8")
      manifestContent = manifestContent.replace(
        /name:\s*["'][^"']*["']/,
        `name: "${projectName}"`,
      )
      manifestContent = manifestContent.replace(
        /short_name:\s*["'][^"']*["']/,
        `short_name: "${projectName}"`,
      )
      fs.writeFileSync(manifestPath, manifestContent)
    } catch (error) {
      console.log(chalk.red("Error updating manifest.ts:"), error)
    }
  }

  // Modify layout.tsx to set appleWebApp.title to projectName
  const layoutPath = path.join(resolvedPath, "apps/frontend/src/app/layout.tsx")

  if (fs.existsSync(layoutPath)) {
    try {
      let layoutContent = fs.readFileSync(layoutPath, "utf-8")
      layoutContent = layoutContent.replace(
        /title:\s*["'][^"']*["']/,
        `title: "${projectName}"`,
      )
      fs.writeFileSync(layoutPath, layoutContent)
    } catch (error) {
      console.log(chalk.red("Error updating layout.tsx:"), error)
    }
  }

  // Read the version from ent-stack-version.txt
  const versionFilePath = path.join(__dirname, "ent-stack-version.txt")
  if (!fs.existsSync(versionFilePath)) {
    console.error(chalk.red("Error: ent-stack-version.txt not found."))
    process.exit(1)
  }

  const version = fs.readFileSync(versionFilePath, "utf8").trim()
  if (!version) {
    console.error(chalk.red("Error: ent-stack-version.txt is empty."))
    process.exit(1)
  }

  // Create a new README.md file
  const readmePath = path.join(resolvedPath, "README.md")
  const readmeContent = `# ${projectName.toUpperCase()}
  
Based on version ${version} of the [ENT Stack](https://github.com/ironexdev/ent-stack). 

## 🔥 Now Setup Your Project

\`\`\`bash
pnpm fire    
\`\`\`
- Installs dependencies
- Starts the local database in a Docker container
- Creates the database and tables
- Runs dev environments for both the backend and frontend

## 🧪 And Then Configure Mailing and Run Tests

https://github.com/ironexdev/ent-stack?tab=readme-ov-file#3--configure-mailing-and-run-tests

## Check the troubleshooting section if you encounter any issues

https://github.com/ironexdev/ent-stack?tab=readme-ov-file#troubleshooting
`
  try {
    fs.writeFileSync(readmePath, readmeContent)
  } catch (error) {
    console.log(chalk.red("Error creating README.md:"), error)
  }

  // Output results
  console.log(
    chalk.hex("#B8B9FF")(`\nProject scaffolded at: ${resolvedPath}\n`),
  )

  // Remind the user to create .env files
  console.log(
    chalk.hex("#B8B9FF")(
      `Now you can run "pnpm fire" to setup the project, and make sure to also read the Environment Variables section https://ironexdev.github.io/ent-stack-documentation/ent-stack/setup`,
    ),
  )
}

// Recursively copies all files/folders from source to destination
function copyRecursiveSync(src: string, dest: string) {
  // If file/folder doesn't exist, just return
  if (!fs.existsSync(src)) return

  const stats = fs.statSync(src)
  if (stats.isDirectory()) {
    // Create dest dir if it doesn't exist
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest)
    }
    // Recurse through child items
    fs.readdirSync(src).forEach((childItemName) => {
      copyRecursiveSync(
        path.join(src, childItemName),
        path.join(dest, childItemName),
      )
    })
  } else {
    // Copy file
    fs.copyFileSync(src, dest)
  }
}

// Recursively find and rename all keep.gitignore files to .gitignore

function renameKeepGitignoreFiles(dirPath: string) {
  if (!fs.existsSync(dirPath)) return
  const files = fs.readdirSync(dirPath)

  for (const file of files) {
    const filePath = path.join(dirPath, file)
    const stat = fs.statSync(filePath)

    if (stat.isDirectory()) {
      // Recursively handle nested directories
      renameKeepGitignoreFiles(filePath)
    } else if (file === "keep.gitignore") {
      // Rename the file to .gitignore
      const newFilePath = path.join(dirPath, ".gitignore")
      fs.renameSync(filePath, newFilePath)
    }
  }
}
