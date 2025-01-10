import { randomBytes } from "crypto"
import fs from "fs"

export function ensureDirSync(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

export function generateJWTSecret(length = 32) {
  return randomBytes(length).toString("base64")
}
