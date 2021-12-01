import fs, { constants, promises as fsp } from 'fs'
import { parse, dirname, resolve } from 'path'

export interface FindUpOptions {
  /**
   * @default process.cwd
   */
  cwd?: string
  /**
   * @default path.parse(cwd).root
   */
  stopAt?: string
  /**
   * @default false
   */
  multiple?: boolean
  /**
   * @default true
   */
  allowSymlinks?: boolean
}

function existsSync(fp: string) {
  try {
    fs.accessSync(fp, constants.R_OK)
    return true
  }
  catch {
    return false
  }
}

export async function findUp(paths: string[], options: FindUpOptions = {}): Promise<string[]> {
  const {
    cwd = process.cwd(),
    stopAt = parse(cwd).root,
    multiple = false,
    allowSymlinks = true,
  } = options

  let current = cwd

  const files: string[] = []

  const stat = allowSymlinks ? fsp.stat : fsp.lstat

  while (current && current !== stopAt) {
    for (const path of paths) {
      const filepath = resolve(current, path)
      if (existsSync(filepath) && (await stat(filepath)).isFile()) {
        files.push(filepath)
        if (!multiple)
          return files
      }
    }
    const parent = dirname(current)
    if (parent === current)
      break
    current = parent
  }

  return files
}
