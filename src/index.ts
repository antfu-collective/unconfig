import { promises as fs } from 'fs'
import jiti from 'jiti'
import { notNullish, toArray } from '@antfu/utils'
import defu from 'defu'
import { LoadConfigOptions, LoadConfigResult, LoadConfigSource, defaultExtensions } from './types'
import { findUp } from './fs'

export * from './types'
export * from './presets'

export async function loadConfig<T>(options: LoadConfigOptions): Promise<LoadConfigResult<T> | undefined> {
  const sources = toArray(options.sources || [])
  const {
    cwd = process.cwd(),
    merge,
  } = options

  const results: LoadConfigResult<any>[] = []

  for (const source of sources) {
    const { extensions = defaultExtensions } = source

    const flatTargets = toArray(source?.files || [])
      .flatMap(file => extensions.map(i => i ? `${file}.${i}` : file))

    if (!flatTargets.length)
      continue

    const files = await findUp(flatTargets, { cwd, stopAt: options.stopAt, multiple: merge })

    if (!files.length)
      continue

    if (!merge) {
      return await loadConfigFile(files[0], source)
    }
    else {
      results.push(
        ...(await Promise.all(
          files.map(file => loadConfigFile(file, source)))
        ).filter(notNullish),
      )
    }
  }

  if (!results.length)
    return

  return {
    // @ts-expect-error
    config: defu(...results.map(i => i.config)),
    sources: results.map(i => i.sources).flat(),
  }
}

async function loadConfigFile<T>(filepath: string, source: LoadConfigSource<T>): Promise<LoadConfigResult<T> | undefined> {
  let config: T | undefined

  let loader = source.loader || 'auto'

  if (loader === 'auto') {
    const content = await fs.readFile(filepath, 'utf-8')
    try {
      config = JSON.parse(content)
      loader = 'json'
    }
    catch {
      loader = 'bundle'
    }
  }
  else {
    loader = 'bundle'
  }

  if (!config) {
    if (loader === 'bundle') {
      config = await jiti(undefined, { interopDefault: true })(filepath)
      if (!config)
        return undefined
    }
    else if (loader === 'json') {
      const content = await fs.readFile(filepath, 'utf-8')
      config = JSON.parse(content)
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
