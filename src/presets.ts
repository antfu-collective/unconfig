import { LoadConfigSource } from './types'

export interface LoadVitePluginConfigOptions {
  pluginNames: string[]
}

export interface LoadObjectFieldOptions {
  fields: string[]
}

export function loadVitePluginConfig(options: LoadVitePluginConfigOptions): LoadConfigSource {
  return {
    files: ['vite.config'],
    async rewrite(obj) {
      const config = await (typeof obj === 'function' ? obj() : obj)
      if (!config)
        return config
      return config.plugins.find((i: any) => options.pluginNames.includes(i.name) && i?.api?.config)?.api?.config
    },
  }
}

export function loadViteConfigFields(options: LoadObjectFieldOptions): LoadConfigSource {
  return {
    files: ['vite.config'],
    async rewrite(obj) {
      const config = await (typeof obj === 'function' ? obj() : obj)
      if (!config)
        return config
      for (const field of options.fields) {
        if (field in config)
          return config[field]
      }
    },
  }
}

export function loadPackageJsonFields(options: LoadObjectFieldOptions): LoadConfigSource {
  return {
    files: ['package.json'],
    extensions: [],
    loader: 'json',
    rewrite(obj: any) {
      for (const field of options.fields) {
        if (field in obj)
          return obj[field]
      }
    },
  }
}
