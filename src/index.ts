#!/usr/bin/env node

import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import readline from "readline/promises"
import { stdin as input, stdout as output } from "process"
import chalk from "chalk"
import { extract } from "tar"
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

  // Create a directory named after the project
  const resolvedPath = path.resolve(projectName)

  // Define source file path
  const sourceFile = path.join(__dirname, "source.tar.gz")

  // Ensure project directory exists
  ensureDirSync(resolvedPath)

  // Extract the archive directly into the project directory
  try {
    extract({
      file: sourceFile,
      cwd: resolvedPath, // Directly extract to the project directory
      sync: true,
    })

    // Remove the source.tar.gz file after successful extraction
    fs.unlinkSync(sourceFile)
    console.log(chalk.green("Source archive removed after extraction."))
  } catch (error) {
    console.error("Extraction failed:", error)
  }

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

  // Create a new README.md file
  const readmePath = path.join(resolvedPath, "README.md")
  const readmeContent = `# ${projectName}`

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
