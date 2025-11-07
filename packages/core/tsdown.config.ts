import { defineConfig } from 'tsdown'
import Quansync from 'unplugin-quansync/rolldown'

export default defineConfig({
  dts: {
    resolve: ['@antfu/utils'],
  },
  exports: {
    devExports: 'dev',
  },
  inlineOnly: ['@antfu/utils'],
  plugins: [
    Quansync(),
  ],
})
