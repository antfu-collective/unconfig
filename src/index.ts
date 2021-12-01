import { promises as fs } from 'fs'
import { dirname, basename, join } from 'path'
import jiti from 'jiti'
import { notNullish, toArray } from '@antfu/utils'
import defu from 'defu'
import { LoadConfigOptions, LoadConfigResult, LoadConfigSource, defaultExtensions } from './types'
import { findUp } from './fs'

export * from './types'

export function createConfigLoader(options: LoadConfigOptions) {
  const sources = toArray(options.sources || [])
  const {
    cwd = process.cwd(),
    merge,
    defaults,
  } = options

  const results: LoadConfigResult<any>[] = []
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

  async function load(force = false) {
    if (matchedFiles == null || force)
      await findConfigs()

    for (const [source, files] of matchedFiles!) {
      if (!files.length)
        continue

      if (!merge) {
        const result = await loadConfigFile(files[0], source)
        if (result) {
          return {
            config: defu(result.config, defaults),
            sources: result.sources,
          }
        }
      }
      else {
        results.push(
          ...(await Promise.all(
            files.map(file => loadConfigFile(file, source)))
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
      // @ts-expect-error
      config: defu(...results.map(i => i.config), defaults),
      sources: results.map(i => i.sources).flat(),
    }
  }

  return {
    load,
    findConfigs,
  }
}

export async function loadConfig<T>(options: LoadConfigOptions): Promise<LoadConfigResult<T>> {
  return createConfigLoader(options).load()
}

async function loadConfigFile<T>(filepath: string, source: LoadConfigSource<T>): Promise<LoadConfigResult<T> | undefined> {
  let config: T | undefined

  let loader = source.parser || 'auto'

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

  if (loader === 'auto') {
    try {
      config = JSON.parse(await read())
      loader = 'json'
    }
    catch {
      loader = 'bundle'
    }
  }
  else {
    loader = 'bundle'
  }

  try {
    if (!config) {
      if (loader === 'bundle') {
        config = await jiti(undefined, { interopDefault: true, cache: false, requireCache: false, v8cache: false })(bundleFilepath)
        if (!config)
          return undefined
      }
      else if (loader === 'json') {
        config = JSON.parse(await read())
      }
    }

    if (!config)
      return

    const rewritten = source.rewrite
      ? await source.rewrite(config, filepath, loader)
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
      await fs.unlink(bundleFilepath)
  }
}
