import { toArray, Arrayable } from '@antfu/utils'
import { LoadConfigSource } from './types'

export interface SourceVitePluginConfigOptions {
  plugins: Arrayable<string>
}

export interface SourceObjectFieldOptions {
  fields: Arrayable<string>
}

export function sourceVitePluginConfig(options: SourceVitePluginConfigOptions): LoadConfigSource {
  const plugins = toArray(options.plugins)
  return {
    files: ['vite.config'],
    async rewrite(obj) {
      const config = await (typeof obj === 'function' ? obj() : obj)
      if (!config)
        return config
      return config.plugins.find((i: any) => plugins.includes(i.name) && i?.api?.config)?.api?.config
    },
  }
}

export function sourceViteConfigFields(options: SourceObjectFieldOptions): LoadConfigSource {
  return {
    files: ['vite.config'],
    ...rewriteFields(options),
  }
}

export function sourceNuxtConfigFields(options: SourceObjectFieldOptions): LoadConfigSource {
  return {
    files: ['nuxt.config'],
    ...rewriteFields(options),
  }
}

export function sourcePackageJsonFields(options: SourceObjectFieldOptions): LoadConfigSource {
  return {
    files: ['package.json'],
    extensions: [],
    loader: 'json',
    ...rewriteFields(options),
  }
}

function rewriteFields(options: SourceObjectFieldOptions): Pick<LoadConfigSource, 'rewrite'> {
  const fields = toArray(options.fields)
  return {
    async rewrite(obj) {
      const config = await (typeof obj === 'function' ? obj() : obj)
      if (!config)
        return config
      for (const field of fields) {
        if (field in config)
          return config[field]
      }
    },
  }
}
