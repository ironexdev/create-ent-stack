# Create ENT Stack

<div align="center">

[![NPM version][npm-image]][npm-url] [![Setup Guide][setup-guide-image]][setup-guide-url] [![ffn][documentation-image]][documentation-url]

</div>

This <a href="https://www.npmjs.com/package/create-ent-stack" target="_blank">NPM package</a> downloads <a href="https://github.com/ironexdev/ent-stack" target="_blank">ENT Stack</a> repository and uses it to create/scaffold a new project.

🔀 Current version of this package uses <a href="https://github.com/ironexdev/ent-stack" target="_blank">ENT Stack</a> tagged with **0.0.5**.

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

1/ Run `pnpm run set-version <version>` to set version of the ENT Stack to be used
- Make sure to check the correct version was set to src/ent-stack-version.txt and to README.md

2/ Bump package version in `package.json`

3/ Run `pnpm run build` to build the package

4/ Run `pnpm run create` to create new project

5/ Test the new project
- Navigate to the newly created project
- Run `pnpm fire` to setup the project
- Manually test the project (automatic tests are not yet implemented)

6/ Git commit and push changes

7/ Run `npm publish` to publish new version of the package

[npm-url]: https://www.npmjs.com/package/create-ent-stack
[npm-image]: https://img.shields.io/npm/v/create-ent-stack?color=b45bf5&logoColor=0b7285

[setup-guide-url]: https://ironexdev.github.io/ent-stack-documentation/ent-stack/setup/
[setup-guide-image]: https://img.shields.io/badge/setup_guide-726fff

[documentation-url]: https://ironexdev.github.io/ent-stack-documentation/ent-stack/documentation
[documentation-image]: https://img.shields.io/badge/documentation-726fff