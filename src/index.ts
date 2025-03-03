import type { QuansyncAwaitableGenerator } from 'quansync'
import type { LoadConfigOptions, LoadConfigResult, LoadConfigSource } from './types'
import { createRequire } from 'node:module'
import { basename, dirname, join } from 'node:path'
import process from 'node:process'
import { pathToFileURL } from 'node:url'
import { toArray } from '@antfu/utils'
import { readFile, unlink, writeFile } from '@quansync/fs'
import defu from 'defu'
import { quansync } from 'quansync/macro'
import { findUp } from './fs'
import { interopDefault } from './interop'
import { defaultExtensions } from './types'

export * from './types'

const require = createRequire(import.meta.url)

const loadConfigFile = quansync(async <T>(
  filepath: string,
  source: LoadConfigSource<T>,
): Promise<LoadConfigResult<T> | undefined> => {
  let config: T | undefined
  let parser = source.parser || 'auto'

  let bundleFilepath = filepath
  let code: string | undefined
  let dependencies: string[] | undefined

  const read = quansync(async () => {
    if (code == null)
      code = await readFile(filepath, 'utf8')
    return code
  })

  const builtinTS = process.features.typescript || process.versions.bun || process.versions.deno
  const importModule = quansync({
    sync: () => {
      if (builtinTS) {
        const defaultImport = require(bundleFilepath)
        config = interopDefault(defaultImport)
      }
      else {
        const { createJiti } = require('jiti') as typeof import('jiti')
        const jiti = createJiti(import.meta.url, {
          fsCache: false,
          moduleCache: false,
          interopDefault: true,
        })
        config = interopDefault(jiti(bundleFilepath))
        dependencies = Object.values(jiti.cache)
          .map(i => i.filename)
          .filter(Boolean)
      }
    },
    async: async () => {
      if (builtinTS) {
        const defaultImport = await import(pathToFileURL(bundleFilepath).href)
        config = interopDefault(defaultImport)
      }
      else {
        const { createJiti } = await import('jiti')
        const jiti = createJiti(import.meta.url, {
          fsCache: false,
          moduleCache: false,
          interopDefault: true,
        })
        config = interopDefault(await jiti.import(bundleFilepath, { default: true }))
        dependencies = Object.values(jiti.cache)
          .map(i => i.filename)
          .filter(Boolean)
      }
    },
  })

  if (source.transform) {
    const transformed = await source.transform(await read(), filepath)
    if (transformed) {
      bundleFilepath = join(dirname(filepath), `__unconfig_${basename(filepath)}`)
      await writeFile(bundleFilepath, transformed, 'utf8')
      code = transformed
    }
  }

  if (parser === 'auto') {
    try {
      config = JSON.parse(await read())
      parser = 'json'
    }
    catch {
      parser = 'import'
    }
  }

  try {
    if (!config) {
      if (typeof parser === 'function') {
        config = await parser(filepath)
      }
      else if (parser === 'import') {
        await importModule()
      }
      else if (parser === 'json') {
        config = JSON.parse(await read())
      }
    }

    if (!config)
      return

    const rewritten = source.rewrite
      ? await source.rewrite(config, filepath)
      : config

    if (!rewritten)
      return undefined

    return {
      config: rewritten,
      sources: [filepath],
      dependencies,
    }
  }
  catch (e) {
    if (source.skipOnError)
      return
    throw e
  }
  finally {
    if (bundleFilepath !== filepath) {
      try {
        await unlink(bundleFilepath)
      }
      catch {}
    }
  }
}) as {
  <T>(filepath: string, source: LoadConfigSource<T>): QuansyncAwaitableGenerator<LoadConfigResult<T> | undefined>
  sync: <T>(filepath: string, source: LoadConfigSource<T>) => LoadConfigResult<T> | undefined
  async: <T>(filepath: string, source: LoadConfigSource<T>) => Promise<LoadConfigResult<T> | undefined>
}

export function createConfigLoader<T>(options: LoadConfigOptions) {
  const sources = toArray(options.sources || [])
  const {
    cwd = process.cwd(),
    merge,
    defaults,
  } = options

  const results: LoadConfigResult<T>[] = []
  let matchedFiles: [LoadConfigSource, string[]][] | undefined

  const findConfigs = quansync(async () => {
    if (matchedFiles == null)
      matchedFiles = []

    matchedFiles.length = 0
    for (const source of sources) {
      const { extensions = defaultExtensions } = source

      const flatTargets = toArray(source?.files || [])
        .flatMap(file => !extensions.length
          ? [file]
          : extensions.map(i => i ? `${file}.${i}` : file),
        )

      const files = await findUp(flatTargets, { cwd, stopAt: options.stopAt, multiple: merge })

      matchedFiles.push([source, files])
    }

    return matchedFiles.flatMap(i => i[1])
  })

  const load = quansync(async (force = false): Promise<LoadConfigResult<T>> => {
    if (matchedFiles == null || force)
      await findConfigs()

    for (const [source, files] of matchedFiles!) {
      if (!files.length)
        continue

      if (!merge) {
        const result = await loadConfigFile(files[0], source)
        if (result) {
          return {
            config: applyDefaults(result.config, defaults),
            sources: result.sources,
            dependencies: result.dependencies,
          }
        }
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

    if (!results.length) {
      return {
        config: defaults,
        sources: [],
      }
    }

    return {
      config: applyDefaults(...results.map(i => i.config), defaults),
      sources: results.map(i => i.sources).flat(),
      dependencies: results.flatMap(i => i.dependencies || []),
    }
  })

  return {
    load,
    findConfigs,
  }
}

function applyDefaults(...args: any[]): any {
  // defu does not support top-level array merging, we wrap it with an object and unwrap it
  // @ts-expect-error cast
  return defu(...args.map((i: any) => ({ config: i }))).config
}

export const loadConfig = quansync(
  async <T>(options: LoadConfigOptions<T>): Promise<LoadConfigResult<T>> => {
    return createConfigLoader<T>(options).load()
  },
) as {
  <T>(options: LoadConfigOptions<T>): QuansyncAwaitableGenerator<LoadConfigResult<T>>
  sync: <T>(options: LoadConfigOptions<T>) => LoadConfigResult<T>
  async: <T>(options: LoadConfigOptions<T>) => Promise<LoadConfigResult<T>>
}
export const loadConfigSync = loadConfig.sync
