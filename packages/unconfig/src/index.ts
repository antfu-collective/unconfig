import type { QuansyncAwaitableGenerator } from 'quansync/macro'
import type { CoreLoadConfigSource } from 'unconfig-core'
import type { LoadConfigOptions, LoadConfigResult, LoadConfigSource } from './types'
import { createRequire } from 'node:module'
import { basename, dirname, join } from 'node:path'
import { toArray } from '@antfu/utils'
import { readFile, unlink, writeFile } from '@quansync/fs'
import defu from 'defu'
import { quansync } from 'quansync/macro'
import { createConfigCoreLoader } from 'unconfig-core'
import { interopDefault } from './interop'
import { defaultExtensions } from './types'

export * from './types'
export * from 'unconfig-core'

const require = createRequire(import.meta.url)

type BuiltParserResult<T> = [config: T, dependencies?: string[]]

const loadConfigFile = quansync(async <T>(
  filepath: string,
  source: LoadConfigSource<T>,
): Promise<BuiltParserResult<T> | undefined> => {
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

  const importModule = quansync({
    sync: () => {
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
    },
    async: async () => {
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

    return [rewritten, dependencies]
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
  <T>(filepath: string, source: LoadConfigSource<T>): QuansyncAwaitableGenerator<BuiltParserResult<T> | undefined>
  sync: <T>(filepath: string, source: LoadConfigSource<T>) => BuiltParserResult<T> | undefined
  async: <T>(filepath: string, source: LoadConfigSource<T>) => Promise<BuiltParserResult<T> | undefined>
}

export function createConfigLoader<T>(options: LoadConfigOptions) {
  const { merge, defaults, sources, ...coreOptions } = options
  const coreSources = toArray(sources || []).map((source): CoreLoadConfigSource<BuiltParserResult<T>> => {
    return {
      ...source,
      files: toArray(source.files),
      extensions: source.extensions || defaultExtensions,
      parser: filepath => loadConfigFile<T>(filepath, source),
    }
  })

  const core = createConfigCoreLoader<BuiltParserResult<T>>({
    ...coreOptions,
    multiple: merge,
    sources: coreSources,
  })

  const load = quansync(async (force = false): Promise<LoadConfigResult<T>> => {
    const results = await core.load(force)
    if (!results.length) {
      return {
        config: defaults,
        sources: [],
      }
    }

    if (!merge) {
      return {
        config: results[0].config[0],
        sources: [results[0].source],
        dependencies: results[0].config[1],
      }
    }

    return {
      config: applyDefaults(...results.map(i => i.config[0]), defaults),
      sources: results.map(i => i.source),
      dependencies: results.flatMap(i => i.config[1] || []),
    }
  })

  return {
    load,
    findConfigs: core.findConfigs,
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
