export interface LoadConfigSource {
  files: string[]
  rewrite: (obj: any, filepath: string) => Promise<any> | any
}

export interface LoadConfigOptions {
  sources: LoadConfigSource[]
}

export interface LoadConfigResult<T> {
  config: T
  filename: string
  mtime: number
}

export async function loadConfig<T>(options?: LoadConfigOptions): Promise<LoadConfigResult<T> | undefined> {
  const { sources = [] } = options || {}
  for (const source of sources) {
    const result = await loadConfigFromSource<T>(source)
    if (result)
      return result
  }
}

export async function loadConfigFromSource<T>(source: LoadConfigSource): Promise<LoadConfigResult<T> | undefined> {
  return undefined
}
