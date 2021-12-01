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
  parser?: ConfigLoaderType | 'auto'

  /**
   * Rewrite the config object,
   * return nullish value to bypassing loading the file
   */
  rewrite?: <F = any>(obj: F, filepath: string, loader: ConfigLoaderType) => Promise<T | undefined> | T | undefined

  /**
   * Transform the source code before loading,
   * return nullish value to skip transformation
   */
  transform?: (code: string, filepath: string) => Promise<string | undefined> | string | undefined

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

export interface LoadConfigOptions<T = any> extends SearchOptions {
  sources: Arrayable<LoadConfigSource<T>>
  defaults?: T
}

export interface LoadConfigResult<T> {
  config: T
  sources: string[]
}
