import { dirname, parse, resolve } from 'node:path'
import process from 'node:process'
import { lstat, stat } from '@quansync/fs'
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

const isFile = quansync(async (path: string, allowSymlinks: boolean) => {
  try {
    return (await (allowSymlinks ? stat : lstat)(path)).isFile()
  }
  catch {
    return false
  }
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
