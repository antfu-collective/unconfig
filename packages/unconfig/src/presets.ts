import type { Arrayable } from '@antfu/utils'
import type { LoadConfigSource } from './types'
import { toArray } from '@antfu/utils'
import { quansync } from 'quansync/macro'

export interface SourceVitePluginConfigOptions {
  plugins: Arrayable<string>
  /**
   * Parameters that passed to when the default export is a function
   */
  parameters?: any[]
}

export interface SourceObjectFieldOptions extends Omit<LoadConfigSource, 'rewrite'> {
  fields: Arrayable<string>
  /**
   * Parameters that passed to when the default export is a function
   */
  parameters?: any[]
}

export interface SourcePluginFactoryOptions extends Omit<LoadConfigSource, 'transform'> {
  targetModule: string
  /**
   * Parameters that passed to when the default export is a function
   */
  parameters?: any[]
}

/**
 * Rewrite the config file and extract the options passed to plugin factory
 * (e.g. Vite and Rollup plugins)
 */
export function sourcePluginFactory(options: SourcePluginFactoryOptions) {
  return {
    ...options,
    transform: (source: string) => {
      const prefix = `
let __unconfig_data;
let __unconfig_stub = function (data = {}) { __unconfig_data = data };
__unconfig_stub.default = (data = {}) => { __unconfig_data = data };
`
      const suffix = 'export default __unconfig_data;'
      let code = source
        .replace(new RegExp(`import (.+?) from (['"])${options.targetModule}\\2`), 'const $1 = __unconfig_stub;')
        .replace('export default', 'const __unconfig_default = ')
      if (code.includes('__unconfig_default'))
        code += `\nif (typeof __unconfig_default === "function") __unconfig_default(...${JSON.stringify(options.parameters || [])});`
      return `${prefix}${code}${suffix}`
    },
  }
}

export function sourceVitePluginConfig(options: SourceVitePluginConfigOptions): LoadConfigSource {
  const plugins = toArray(options.plugins)
  return {
    files: ['vite.config'],
    rewrite: quansync(async (obj) => {
      const config = await (typeof obj === 'function' ? obj(...options.parameters || [{ env: {} }, {}]) : obj)
      if (!config)
        return config
      return config.plugins.find((i: any) => plugins.includes(i.name) && i?.api?.config)?.api?.config
    }),
  }
}

/**
 * Get one field of the config object
 */
export function sourceObjectFields(options: SourceObjectFieldOptions): LoadConfigSource {
  const fields = toArray(options.fields)
  return {
    ...options,
    rewrite: quansync(async (obj) => {
      const config = await (typeof obj === 'function' ? obj(...options.parameters || []) : obj)
      if (!config)
        return config
      for (const field of fields) {
        if (field in config)
          return config[field]
      }
    }),
  }
}

/**
 * Get one field of `package.json`
 */
export function sourcePackageJsonFields(options: Pick<SourceObjectFieldOptions, 'fields'>): LoadConfigSource {
  return sourceObjectFields({
    files: ['package.json'],
    extensions: [],
    parser: 'json',
    fields: options.fields,
  })
}
