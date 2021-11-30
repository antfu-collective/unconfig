import { promises as fs } from 'fs'
import jiti from 'jiti'
import { toArray } from '@antfu/utils'
import { LoadConfigOptions, LoadConfigResult, LoadConfigSource, SearchOptions, defaultExtensions } from './types'
import { findUp } from './fs'

export * from './types'
export * from './presets'

export async function loadConfig<T>(options?: LoadConfigOptions): Promise<LoadConfigResult<T> | undefined> {
  const sources = toArray(options?.sources || [])
  for (const source of sources) {
    const result = await loadConfigFromSource<T>(source, options)
    if (result)
      return result
  }
}

export async function loadConfigFromSource<T>(source: LoadConfigSource<T>, search: SearchOptions = {}): Promise<LoadConfigResult<T> | undefined> {
  const { extensions = defaultExtensions } = source

  const flatFiles = toArray(source?.files || []).flatMap((file) => {
    return extensions.map(i => i ? `${file}.${i}` : file)
  })

  if (!flatFiles.length)
    return undefined

  const { cwd = process.cwd() } = search
  const files = await findUp(flatFiles, { cwd, stopAt: search.stopAt })

  if (!files.length)
    return undefined

  return await loadConfigFile(files[0], source)
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
