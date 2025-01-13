#!/usr/bin/env node

import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import { execSync } from "child_process"
import https from "https"
import { IncomingMessage } from "http"
import chalk from "chalk"
import AdmZip from "adm-zip"
import { ensureDirSync } from "./utils.js"

type Tag = {
  name: string
}

// Resolve __dirname in ESM
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Define the repository details
const GIT_REPO_URL = "https://github.com/ironexdev/ent-stack.git"
const GIT_REPO_API = "https://api.github.com/repos/ironexdev/ent-stack"
const sourceDir: string = path.resolve(__dirname, "source")

// Read the version from ent-stack-version.txt
const versionFilePath: string = path.join(__dirname, "ent-stack-version.txt")
if (!fs.existsSync(versionFilePath)) {
  console.error(chalk.red("Error: ent-stack-version.txt not found."))
  process.exit(1)
}

const version: string = fs.readFileSync(versionFilePath, "utf8").trim()
if (!version) {
  console.error(chalk.red("Error: ent-stack-version.txt is empty."))
  process.exit(1)
}

main().catch((error: unknown) => {
  console.error(chalk.red("Unexpected error in main function:"), error)
  process.exit(1)
})

async function main(): Promise<void> {
  await checkVersionExists(version)

  // Remove existing source directory if it exists
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
    const zipPath: string = path.join(__dirname, "source.zip")
    const downloadUrl: string = `https://github.com/ironexdev/ent-stack/archive/refs/tags/${version}.zip`

    // Using curl to download
    execSync(`curl -L ${downloadUrl} -o ${zipPath}`, { stdio: "inherit" })

    // Extract the ZIP into the source directory using adm-zip
    console.log(`Extracting ${zipPath} into ${sourceDir}...`)
    const zip = new AdmZip(zipPath)
    zip.extractAllTo(path.dirname(sourceDir), true)

    // Rename the extracted folder
    const extractedDir: string = path.join(
      path.dirname(sourceDir),
      `ent-stack-${version}`,
    )
    fs.renameSync(extractedDir, sourceDir)

    // Remove the ZIP file
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
      console.error("Unknown error downloading version:", error)
    }
    process.exit(1)
  }

  // Rename all .gitignore files to keep.gitignore
  console.log("Renaming all .gitignore files to keep.gitignore...")
  renameGitignoreFiles(sourceDir)
  console.log("Renaming complete!")

  // Remove LICENSE file (optional)
  const licensePath: string = path.join(sourceDir, "LICENSE")
  try {
    fs.unlinkSync(licensePath)
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.log(chalk.red("Error deleting LICENSE file:"), error.message)
    }
  }

  // Copy backend.env and frontend.env
  try {
    const backendEnvPath = path.join(sourceDir, "apps/backend/.env")
    const frontendEnvPath = path.join(sourceDir, "apps/frontend/.env")

    fs.copyFileSync(path.join(__dirname, "backend.env"), backendEnvPath)
    fs.copyFileSync(path.join(__dirname, "frontend.env"), frontendEnvPath)
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.log(chalk.red("Error copying .env files:"), error.message)
    }
  }

  // NEW STEP: Add +x permissions to all files in bin
  const binPath = path.join(sourceDir, "bin")
  addExecutePermissionsToBin(binPath)

  console.log(chalk.green("Prepack script completed successfully!"))
}

function renameGitignoreFiles(dirPath: string): void {
  if (!fs.existsSync(dirPath)) return
  const files = fs.readdirSync(dirPath)

  for (const file of files) {
    const filePath = path.join(dirPath, file)
    const stat = fs.statSync(filePath)

    if (stat.isDirectory()) {
      // Recursively rename .gitignore in subdirectories
      renameGitignoreFiles(filePath)
    } else if (file === ".gitignore") {
      // Rename the file to keep.gitignore
      const newFilePath = path.join(dirPath, "keep.gitignore")
      fs.renameSync(filePath, newFilePath)
      console.log(`Renamed ${filePath} -> ${newFilePath}`)
    }
  }
}

// Recursively walks through the given `bin` directory and adds executable permissions (chmod +x or 0755) to all files
function addExecutePermissionsToBin(dirPath: string): void {
  if (!fs.existsSync(dirPath)) return
  const files = fs.readdirSync(dirPath)

  for (const file of files) {
    const filePath = path.join(dirPath, file)
    const stat = fs.statSync(filePath)

    if (stat.isDirectory()) {
      // Recurse into subdirectories (if you want to recursively set +x)
      addExecutePermissionsToBin(filePath)
    } else {
      // Set permissions to 0755
      fs.chmodSync(filePath, "0755")
      console.log(`Added execute permissions to ${filePath}`)
    }
  }
}

function checkVersionExists(version: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const url: string = `${GIT_REPO_API}/tags`
    const options: https.RequestOptions = {
      headers: {
        "User-Agent": "Node.js",
      },
    }

    https
      .get(url, options, (res: IncomingMessage) => {
        if (res.statusCode !== 200) {
          reject(
            new Error(
              `GitHub API returned status ${res.statusCode}: ${res.statusMessage}`,
            ),
          )
          return
        }

        let data = ""
        res.on("data", (chunk: Buffer) => {
          data += chunk.toString("utf8")
        })

        res.on("end", () => {
          try {
            const tags = JSON.parse(data) as Tag[]
            const tagExists = tags.some((tag: Tag) => tag.name === version)
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
          } catch (error: unknown) {
            if (error instanceof Error) {
              reject(error)
            } else {
              reject(new Error("Unknown error parsing JSON from GitHub tags."))
            }
          }
        })
      })
      .on("error", (error: Error) => {
        reject(error)
      })
  })
}
