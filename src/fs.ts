import fs from 'node:fs'
import { dirname, parse, resolve } from 'node:path'
import process from 'node:process'
import { quansync } from 'quansync/macro'

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

const isFile = quansync({
  sync: (path: string, allowSymlinks: boolean) => {
    try {
      return fs[allowSymlinks ? 'lstatSync' : 'statSync'](path).isFile()
    }
    catch {
      return false
    }
  },
  async: async (path: string, allowSymlinks: boolean) => {
    try {
      return (await fs.promises[allowSymlinks ? 'lstat' : 'stat'](path)).isFile()
    }
    catch {
      return false
    }
  },
})

export const findUp = quansync(
  async (paths: string[], options: FindUpOptions = {}): Promise<string[]> => {
    const {
      cwd = process.cwd(),
      stopAt = parse(cwd).root,
      multiple = false,
      allowSymlinks = true,
    } = options

    let current = cwd

    const files: string[] = []

    while (current && current !== stopAt) {
      for (const path of paths) {
        const filepath = resolve(current, path)
        if (await isFile(filepath, allowSymlinks)) {
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
  },
)

export const readFile = quansync({
  sync: (path: string) => fs.readFileSync(path, 'utf8'),
  async: path => fs.promises.readFile(path, 'utf8'),
})

export const writeFile = quansync({
  sync: (path: string, data: string) => fs.writeFileSync(path, data),
  async: (path, data) => fs.promises.writeFile(path, data),
})

export const unlink = quansync({
  sync: (path: string) => {
    try {
      fs.unlinkSync(path)
    }
    catch {}
  },
  async: path => fs.promises.unlink(path).catch(() => {}),
})
