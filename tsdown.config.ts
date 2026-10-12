import { defineConfig } from 'tsdown'
import Quansync from 'unplugin-quansync/rolldown'

export default defineConfig({
  workspace: true,
  deps: {
    onlyBundle: ['@antfu/utils'],
  },
  dts: {
    generator: 'tsgo',
  },
  exports: {
    devExports: 'dev',
  },
  plugins: [
    Quansync(),
  ],
})
