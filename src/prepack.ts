#!/usr/bin/env node

import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import { execSync } from "child_process"
import https from "https"
import chalk from "chalk"
import { ensureDirSync } from "./utils.js"
import { create } from "tar"

// Resolve __dirname in ESM
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Define the repository details
const GIT_REPO_URL = "https://github.com/ironexdev/ent-stack.git"
const GIT_REPO_API = "https://api.github.com/repos/ironexdev/ent-stack"
const sourceDir = path.resolve(__dirname, "source")

// Read the version from ent-stack-version.txt
const versionFilePath = path.join(__dirname, "ent-stack-version.txt")
if (!fs.existsSync(versionFilePath)) {
  console.error(chalk.red("Error: ent-stack-version.txt not found."))
  process.exit(1)
}
const version: string = fs.readFileSync(versionFilePath, "utf8").trim()
if (!version) {
  console.error(chalk.red("Error: ent-stack-version.txt is empty."))
  process.exit(1)
}

// Check if the version exists in the repository
async function checkVersionExists(version: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const url = `${GIT_REPO_API}/tags`
    const options = {
      headers: {
        "User-Agent": "Node.js",
      },
    }

    https
      .get(url, options, (res) => {
        if (res.statusCode !== 200) {
          reject(
            new Error(
              `GitHub API returned status ${res.statusCode}: ${res.statusMessage}`,
            ),
          )
          return
        }

        let data = ""
        res.on("data", (chunk) => {
          data += chunk
        })

        res.on("end", () => {
          try {
            const tags: { name: string }[] = JSON.parse(data)
            const tagExists = tags.some((tag) => tag.name === version)
            if (!tagExists) {
              reject(
                new Error(
                  `Version ${version} does not exist in the repository.`,
                ),
              )
            } else {
              console.log(`Version ${version} exists in the repository.`)
              resolve()
            }
          } catch (error) {
            reject(error)
          }
        })
      })
      .on("error", (error) => {
        reject(error)
      })
  })
}

// Main logic
async function main(): Promise<void> {
  await checkVersionExists(version)

  // Ensure the source directory does not already exist (optional safety check)
  if (fs.existsSync(sourceDir)) {
    console.warn(
      `Warning: The directory ${sourceDir} already exists. Removing it...`,
    )
    fs.rmSync(sourceDir, { recursive: true, force: true })
  }

  // Ensure the source directory now exists
  ensureDirSync(sourceDir)

  // Download the specific version as a ZIP file
  try {
    console.log(`Downloading version ${version} from ${GIT_REPO_URL} as ZIP...`)
    const zipPath = path.join(__dirname, "source.zip")
    const downloadUrl = `https://github.com/ironexdev/ent-stack/archive/refs/tags/${version}.zip`

    // Download the ZIP file
    execSync(`curl -L ${downloadUrl} -o ${zipPath}`, { stdio: "inherit" })

    // Extract the ZIP file into the source directory
    console.log(`Extracting ${zipPath} into ${sourceDir}...`)
    execSync(`unzip ${zipPath} -d ${path.dirname(sourceDir)}`, {
      stdio: "inherit",
    })

    // Rename the extracted folder to match `sourceDir`
    const extractedDir = path.join(
      path.dirname(sourceDir),
      `ent-stack-${version}`,
    )
    fs.renameSync(extractedDir, sourceDir)

    // Remove the ZIP file after extraction
    fs.unlinkSync(zipPath)
    console.log(`Removed ZIP file: ${zipPath}`)

    console.log("Download and extraction successful!")
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(
        `Error downloading version ${version} from ${GIT_REPO_URL}:`,
        error.message,
      )
    } else {
      console.error(
        chalk.red("Unknown error occurred while downloading the ZIP file."),
      )
    }
    process.exit(1)
  }

  // Remove LICENSE file
  const licensePath = path.join(sourceDir, "LICENSE")
  try {
    fs.unlinkSync(licensePath)
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.log(chalk.red("Error deleting LICENSE file:"), error.message)
    }
  }

  // Copy backend.env to source/apps/backend/.env and frontend.env to source/apps/frontend/.env
  const backendEnvPath = path.join(sourceDir, "apps/backend/.env")
  const frontendEnvPath = path.join(sourceDir, "apps/frontend/.env")

  try {
    fs.copyFileSync(path.join(__dirname, "backend.env"), backendEnvPath)
    fs.copyFileSync(path.join(__dirname, "frontend.env"), frontendEnvPath)
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.log(chalk.red("Error copying .env files:"), error.message)
    }
  }

  // Package the source directory to a tarball using node-tar and ESM
  create(
    {
      gzip: true,
      file: path.join(__dirname, "source.tar.gz"),
      cwd: sourceDir,
    },
    ["."],
  )
    .then(() => {
      console.log("Packaged source directory to source.tar.gz")

      // Remove the source directory after successful tarball creation
      try {
        fs.rmSync(sourceDir, { recursive: true, force: true })
        console.log(`Removed source directory: ${sourceDir}`)
      } catch (error: unknown) {
        if (error instanceof Error) {
          console.error(
            chalk.red("Error removing source directory:"),
            error.message,
          )
        }
      }
    })
    .catch((error: unknown) => {
      if (error instanceof Error) {
        console.error(
          chalk.red("Error packaging source directory:"),
          error.message,
        )
      }
      process.exit(1)
    })
}

main().catch((error: unknown) => {
  if (error instanceof Error) {
    console.error(
      chalk.red("Unexpected error in main function:"),
      error.message,
    )
  }
  process.exit(1)
})
