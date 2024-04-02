import { promises as fs } from 'node:fs'
import { basename, dirname, join } from 'node:path'
import process from 'node:process'
import { interopDefault } from 'mlly'
import jiti from 'jiti'
import { notNullish, toArray } from '@antfu/utils'
import defu from 'defu'
import type { LoadConfigOptions, LoadConfigResult, LoadConfigSource } from './types'
import { defaultExtensions } from './types'
import { findUp } from './fs'

export * from './types'

export function createConfigLoader<T>(options: LoadConfigOptions) {
  const sources = toArray(options.sources || [])
  const {
    cwd = process.cwd(),
    merge,
    defaults,
  } = options

  const results: LoadConfigResult<T>[] = []
  let matchedFiles: [LoadConfigSource, string[]][] | undefined

  async function findConfigs() {
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
  }

  async function load(force = false): Promise<LoadConfigResult<T>> {
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
          }
        }
      }
      else {
        results.push(
          ...(await Promise.all(
            files.map(file => loadConfigFile(file, source)),
          )
          ).filter(notNullish),
        )
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
    }
  }

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

export async function loadConfig<T>(options: LoadConfigOptions<T>): Promise<LoadConfigResult<T>> {
  return createConfigLoader<T>(options).load()
}

async function loadConfigFile<T>(filepath: string, source: LoadConfigSource<T>): Promise<LoadConfigResult<T> | undefined> {
  let config: T | undefined

  let parser = source.parser || 'auto'

  let bundleFilepath = filepath
  let code: string | undefined

  async function read() {
    if (code == null)
      code = await fs.readFile(filepath, 'utf-8')
    return code
  }

  if (source.transform) {
    const transformed = await source.transform(await read(), filepath)
    if (transformed) {
      bundleFilepath = join(dirname(filepath), `__unconfig_${basename(filepath)}`)
      await fs.writeFile(bundleFilepath, transformed, 'utf-8')
      code = transformed
    }
  }

  if (parser === 'auto') {
    try {
      config = JSON.parse(await read())
      parser = 'json'
    }
    catch {
      parser = 'require'
    }
  }

  try {
    if (!config) {
      if (typeof parser === 'function') {
        config = await parser(filepath)
      }
      else if (parser === 'require') {
        if (process.versions.bun) {
          const defaultImport = await import(filepath)
          config = interopDefault(defaultImport)
        }
        else {
          config = await jiti(filepath, {
            interopDefault: true,
            cache: false,
            v8cache: false,
            esmResolve: true,
            // FIXME: https://github.com/unjs/jiti/pull/141
            requireCache: false,
          })(bundleFilepath)
        }
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
    }
  }
  catch (e) {
    if (source.skipOnError)
      return
    throw e
  }
  finally {
    if (bundleFilepath !== filepath)
      await fs.unlink(bundleFilepath).catch()
  }
}
