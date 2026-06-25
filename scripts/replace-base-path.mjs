import fs from "node:fs"
import path from "node:path"

const PLACEHOLDER = "/__NEXT_RUNTIME_BASE_PATH__"
const ROOT = process.env.NEXT_RUNTIME_REWRITE_ROOT || process.cwd()
const TARGETS = [path.join(ROOT, "server.js"), path.join(ROOT, ".next")]

function normalizeBasePath(value) {
  const trimmed = String(value || "").trim()
  if (!trimmed || trimmed === "/" || trimmed === PLACEHOLDER) return ""
  const prefixed = trimmed.startsWith("/") ? trimmed : `/${trimmed}`
  const normalized = prefixed.replace(/\/+$/, "")

  if (/[\r\n\\?#]/.test(normalized)) {
    throw new Error(`Invalid base path: ${value}`)
  }

  return normalized
}

function escapedPath(value) {
  return value.replaceAll("/", "\\/")
}

function isProbablyText(buffer) {
  return !buffer.includes(0)
}

function walk(target) {
  if (!fs.existsSync(target)) return []

  const stats = fs.statSync(target)
  if (stats.isFile()) return [target]
  if (!stats.isDirectory()) return []

  const files = []
  for (const entry of fs.readdirSync(target, { withFileTypes: true })) {
    files.push(...walk(path.join(target, entry.name)))
  }
  return files
}

function replaceInFile(file, replacements) {
  const buffer = fs.readFileSync(file)
  if (!isProbablyText(buffer)) return false

  let content = buffer.toString("utf8")
  const original = content

  for (const [search, replacement] of replacements) {
    content = content.split(search).join(replacement)
  }

  if (content === original) return false
  fs.writeFileSync(file, content)
  return true
}

const runtimeBasePath = normalizeBasePath(process.env.APP_BASE_PATH)
const replacements = [
  [escapedPath(PLACEHOLDER), escapedPath(runtimeBasePath)],
  [PLACEHOLDER, runtimeBasePath],
]

let changed = 0
for (const target of TARGETS) {
  for (const file of walk(target)) {
    if (replaceInFile(file, replacements)) changed += 1
  }
}

console.log(
  `Runtime base path: ${runtimeBasePath || "<root>"} (${changed} file${changed === 1 ? "" : "s"} updated)`
)
