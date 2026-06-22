import path from "node:path"

export function getDataDir() {
  return process.env.CSG_DATA_DIR
    ? path.resolve(/* turbopackIgnore: true */ process.env.CSG_DATA_DIR)
    : path.join(process.cwd(), "data")
}

export function getDatabasePath() {
  return process.env.CSG_DATABASE_PATH
    ? path.resolve(/* turbopackIgnore: true */ process.env.CSG_DATABASE_PATH)
    : path.join(getDataDir(), "csg-stat.sqlite")
}
