import type { Arrayable } from '@antfu/utils'
import type { CoreLoadConfigSource, CoreSearchOptions, CustomParser } from 'unconfig-core'

export const defaultExtensions = ['mts', 'cts', 'ts', 'mjs', 'cjs', 'js', 'json', '']

export type BuiltinParsers = 'json' | 'import'

export interface LoadConfigSource<T = any> extends Omit<CoreLoadConfigSource<T>, 'files' | 'parser'> {
  files: Arrayable<string>

  /**
   * @default ['mts', 'cts', 'ts', 'mjs', 'cjs', 'js', 'json', '']
   */
  extensions?: string[]

  /**
   * Parser for loading config,
   *
   * @default 'auto'
   */
  parser?: BuiltinParsers | CustomParser<T> | 'auto'

  /**
   * Rewrite the config object,
   * return nullish value to bypassing loading the file
   */
  rewrite?: <F = any>(obj: F, filepath: string) => Promise<T | undefined> | T | undefined

  /**
   * Transform the source code before loading,
   * return nullish value to skip transformation
   */
  transform?: (code: string, filepath: string) => Promise<string | undefined> | string | undefined
}

export interface SearchOptions extends Omit<CoreSearchOptions, 'multiple'> {
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
  dependencies?: string[]
}
