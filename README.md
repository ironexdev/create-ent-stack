# Create ENT Stack

This NPM package downloads <a href="https://github.com/ironexdev/ent-stack" target="_blank">ENT Stack</a> repository and uses it to create/scaffold a new project.

🔀 Current version of this package uses <a href="https://github.com/ironexdev/ent-stack" target="_blank">ENT Stack</a> tagged with **0.0.1**.

## How To Use

Follow the <a href="https://ironexdev.github.io/ent-stack-documentation/ent-stack/setup/" target="_blank">Setup Guide</a> in the ENT Stack documentation.

## Description

This repository contains two main scripts `prepack.ts` and `index.ts`

### The `prepack.ts` script

This script is a prepack step that:
- Downloads the specified version of the ENT Stack repository.
- Removes unnecessary files (like the .git folder and LICENSE).
- Adds .env files with default values for backend and frontend applications.
- Packages the prepared repository into a .tar.gz archive for distribution.

### The `index.ts` script

This script is a CLI tool for scaffolding a new ENT Stack project. It:
- Prompts the user for a project name and validates it.
- Extracts the source files from a prepackaged tarball.
- Creates a new project directory and copies scaffolded files into it.
- Customizes project files like package.json, .env, manifest.ts, and layout.tsx with project-specific values.
- Generates a basic README.md.
- Outputs the project path and setup instructions for the user.

---

The section/s below are for maintainers.

---

## How To Publish

1/ Run `pnpm run set-version` to version of the ENT Stack to be used
- Make sure to check the correct version was set to src/ent-stack-version.txt and to README.md

2/ Bump package version in `package.json`

3/ Run `pnpm run create` to create new project

4/ Test the new project
- Navigate to the newly created project
- Run `pnpm fire` to setup the project
- Manually test the project (automatic tests are not yet implemented)

5/ Run `pnpm publish` to publish new version of the package
