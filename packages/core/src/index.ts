import type { QuansyncAwaitableGenerator, QuansyncFn } from 'quansync/macro'
import type { CoreLoadConfigOptions, CoreLoadConfigResult, CoreLoadConfigSource } from './types'
import process from 'node:process'
import { quansync } from 'quansync/macro'
import { findUp } from './fs'

export * from './types'

const loadConfigFile = quansync(async <T>(
  filepath: string,
  source: CoreLoadConfigSource<T>,
): Promise<CoreLoadConfigResult<T> | undefined> => {
  try {
    const config = await source.parser(filepath)
    if (!config)
      return
    return { config, source: filepath }
  }
  catch (e) {
    if (source.skipOnError)
      return
    throw e
  }
}) as {
  <T>(filepath: string, source: CoreLoadConfigSource<T>): QuansyncAwaitableGenerator<CoreLoadConfigResult<T> | undefined>
  sync: <T>(filepath: string, source: CoreLoadConfigSource<T>) => CoreLoadConfigResult<T> | undefined
  async: <T>(filepath: string, source: CoreLoadConfigSource<T>) => Promise<CoreLoadConfigResult<T> | undefined>
}

export function createConfigCoreLoader<T>(options: CoreLoadConfigOptions): {
  load: QuansyncFn<CoreLoadConfigResult<T>[], [force?: boolean | undefined]>
  findConfigs: QuansyncFn<string[], []>
} {
  const { cwd = process.cwd(), multiple, sources } = options

  const results: CoreLoadConfigResult<T>[] = []
  let matchedFiles: [CoreLoadConfigSource, string[]][] | undefined

  const findConfigs = quansync(async () => {
    if (matchedFiles == null)
      matchedFiles = []

    matchedFiles.length = 0
    for (const source of sources) {
      const { extensions } = source

      const flatTargets = source.files
        .flatMap(file => !extensions?.length
          ? [file]
          : extensions.map(ext => ext ? `${file}.${ext}` : file),
        )

      const files = await findUp(flatTargets, { cwd, stopAt: options.stopAt, multiple })

      matchedFiles.push([source, files])
    }

    return matchedFiles.flatMap(i => i[1])
  })

  const load = quansync(async (force: boolean = false): Promise<CoreLoadConfigResult<T>[]> => {
    if (matchedFiles == null || force)
      await findConfigs()

    for (const [source, files] of matchedFiles!) {
      if (!files.length)
        continue

      if (!multiple) {
        const result = await loadConfigFile(files[0], source)
        if (result)
          return [result]
      }
      else {
        for (const file of files) {
          const result = await loadConfigFile(file, source)
          if (result) {
            results.push(result)
          }
        }
      }
    }

    return results
  })

  return {
    load,
    findConfigs,
  }
}
