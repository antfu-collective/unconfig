import { promises as fs } from 'fs'
import { resolve } from 'path'
import findUp from 'find-up'
import { bundleRequire } from 'bundle-require'
import { LoadConfigOptions, LoadConfigResult, LoadConfigSource, SearchOptions, defaultExtensions, ConfigLoaderType } from './types'

export * from './types'
export * from './presets'

export async function loadConfig<T>(options?: LoadConfigOptions): Promise<LoadConfigResult<T> | undefined> {
  const { sources = [] } = options || {}
  for (const source of sources) {
    const result = await loadConfigFromSource<T>(source, options)
    if (result)
      return result
  }
}

export async function loadConfigFromSource<T>(source: LoadConfigSource<T>, search: SearchOptions = {}): Promise<LoadConfigResult<T> | undefined> {
  const {
    files = [],
    extensions = defaultExtensions,
  } = source

  const { cwd = process.cwd() } = search

  if (!files.length)
    return undefined

  const flatFiles = files.flatMap((file) => {
    return extensions.map(i => i ? `${file}.${i}` : file)
  })

  const file = await findUp(flatFiles, { cwd })

  if (!file)
    return undefined

  return await loadConfigFile(file, source, search)
}

async function loadConfigFile<T>(filepath: string, source: LoadConfigSource<T>, search: SearchOptions = {}): Promise<LoadConfigResult<T> | undefined> {
  let config: T | undefined
  let dependencies = [filepath]

  let loader = source.loader || 'auto'

  if (loader === 'auto') {
    const content = await fs.readFile(filepath, 'utf-8')
    try {
      config = JSON.parse(content)
      loader = 'json'
    }
    catch {}
  }
  else {
    loader = 'bundle'
  }

  if (!config) {
    if (loader === 'bundle') {
      const result = await bundleRequire({ filepath })

      if (!result)
        return undefined

      const { cwd = process.cwd() } = search

      config = result.mod?.default || result.mod
      dependencies = result.dependencies?.map(i => resolve(cwd, i))
    }
    else if (loader === 'json') {
      const content = await fs.readFile(filepath, 'utf-8')
      config = JSON.parse(content)
    }
  }

  if (!config)
    return

  const rewritten = source.rewrite
    ? await source.rewrite(config, filepath, loader as ConfigLoaderType)
    : config

  if (!rewritten)
    return undefined

  const mtime = (await fs.stat(filepath)).mtimeMs

  return {
    filepath,
    config: rewritten,
    dependencies,
    mtime,
  }
}
