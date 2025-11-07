import type { Awaitable } from '@antfu/utils'

export type CustomParser<T> = (filepath: string) => Awaitable<T | undefined>

export interface CoreLoadConfigSource<T = any> {
  files: Array<string>
  extensions: string[]

  /**
   * Parser for loading config,
   */
  parser: CustomParser<T>

  /**
   * Skip this source if error occurred on loading
   *
   * @default false
   */
  skipOnError?: boolean
}

export interface CoreSearchOptions {
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

  multiple?: boolean
}

export interface CoreLoadConfigOptions<T = any> extends CoreSearchOptions {
  sources: Array<CoreLoadConfigSource<T>>
}

export interface CoreLoadConfigResult<T> {
  config: T
  source: string
}
