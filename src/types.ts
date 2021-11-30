import { Arrayable } from '@antfu/utils'

export const defaultExtensions = ['mts', 'cts', 'ts', 'mjs', 'cjs', 'js', 'json', '']

export type ConfigLoaderType = 'bundle' | 'json'

export interface LoadConfigSource<T = any> {
  files: Arrayable<string>

  /**
   * @default ['mts', 'cts', 'ts', 'mjs', 'cjs', 'js', 'json', '']
   */
  extensions?: string[]

  /**
   * Loader for loading config,
   *
   * @default 'auto'
   */
  loader?: ConfigLoaderType | 'auto'

  /**
   * Rewrite the config object
   */
  rewrite?: <F = any>(obj: F, filepath: string, loader: ConfigLoaderType) => Promise<T | undefined> | T | undefined
}

export interface SearchOptions {
  /**
   * Root directory
   *
   * @default process.cwd()
   */
  cwd?: string
}

export interface LoadConfigOptions extends SearchOptions {
  sources: Arrayable<LoadConfigSource>
}

export interface LoadConfigResult<T> {
  config: T
  filepath: string
  mtime: number
}
