#!/usr/bin/env node

import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import readline from "readline/promises"
import { stdin as input, stdout as output } from "process"
import chalk from "chalk"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

await main()

async function main() {
  // Regex for package.json "name" validation
  const packageNameRegex = new RegExp(
      '^(?:@(?:[a-z0-9-*~][a-z0-9-*._~]*)?/)?[a-z0-9-~][a-z0-9-._~]*$'
  )

  // Create a readline interface
  const rl = readline.createInterface({ input, output })

  // Prompt for a valid project name
  let projectName
  while (true) {
    projectName = await rl.question(chalk.cyan("Enter your project name: "))
    if (packageNameRegex.test(projectName)) {
      break // Valid input — break out of the loop
    }
    console.log(
        chalk.red(
            `Project name must match package.json "name" criteria:\n${packageNameRegex.source}`
        )
    )
  }

  // Close readline
  await rl.close()

  // Create a directory named after the project
  const resolvedPath = path.resolve(projectName)

  // Define source directory path
  const sourcePath = path.join(__dirname, "../source")

  // Ensure project directory exists
  ensureDirSync(resolvedPath)

  // Copy the `source` directory to the new project directory
  copyDirectoryContentsSync(sourcePath, resolvedPath)

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

  // Modify the scaffolded manifest.ts
  const manifestPath = path.join(
      resolvedPath,
      "apps/frontend/src/app/manifest.ts"
  )

  if (fs.existsSync(manifestPath)) {
    try {
      let manifestContent = fs.readFileSync(manifestPath, "utf-8")
      manifestContent = manifestContent.replace(
          /name:\s*["'][^"']*["']/,
          `name: "${projectName}"`
      )
      manifestContent = manifestContent.replace(
          /short_name:\s*["'][^"']*["']/,
          `short_name: "${projectName}"`
      )
      fs.writeFileSync(manifestPath, manifestContent)
    } catch (error) {
      console.log(chalk.red("Error updating manifest.ts:"), error)
    }
  }

  // Modify layout.tsx to set appleWebApp.title to projectName
  const layoutPath = path.join(
      resolvedPath,
      "apps/frontend/src/app/layout.tsx"
  )

  if (fs.existsSync(layoutPath)) {
    try {
      let layoutContent = fs.readFileSync(layoutPath, "utf-8")
      layoutContent = layoutContent.replace(
          /title:\s*["'][^"']*["']/,
          `title: "${projectName}"`
      )
      fs.writeFileSync(layoutPath, layoutContent)
    } catch (error) {
      console.log(chalk.red("Error updating layout.tsx:"), error)
    }
  }

  // Create a new README.md file
  const readmePath = path.join(resolvedPath, "README.md")
  const readmeContent = `# ${projectName}`

  try {
    fs.writeFileSync(readmePath, readmeContent)
  } catch (error) {
    console.log(chalk.red("Error creating README.md:"), error)
  }

  // Output results
  console.log(chalk.cyan(`\nProject scaffolded at: ${resolvedPath}\n`))

  // Remind the user to create .env files (in cyan as well)
  console.log(
      chalk.bgCyan(
          `Now finish setting up your project by following the setup guide https://ironexdev.github.io/ent-stack-documentation/ent-stack/setup`
      )
  )
}

// Helpers
function ensureDirSync(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

function copyDirectoryContentsSync(source, destination) {
  const entries = fs.readdirSync(source, { withFileTypes: true })
  for (const entry of entries) {
    const sourceEntryPath = path.join(source, entry.name)
    const destinationPath = path.join(destination, entry.name)
    if (entry.isDirectory()) {
      ensureDirSync(destinationPath)
      copyDirectoryContentsSync(sourceEntryPath, destinationPath)
    } else {
      fs.copyFileSync(sourceEntryPath, destinationPath)
    }
  }
}
