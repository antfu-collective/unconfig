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

  /**
   * Skip this source if error occurred on loading
   *
   * @default false
   */
  skipOnError?: boolean
}

export interface SearchOptions {
  /**
   * Root directory
   *
   * @default process.cwd()
   */
  cwd?: string

  /**
   * @default path.parse(cwd).root
   */
  stopAt?: string

  /**
   * Load from multiple sources and merge them
   *
   * @default false
   */
  merge?: boolean
}

export interface LoadConfigOptions extends SearchOptions {
  sources: Arrayable<LoadConfigSource>
}

export interface LoadConfigResult<T> {
  config: T
  sources: string[]
}
