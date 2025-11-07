import { defineConfig } from 'tsdown'
import Quansync from 'unplugin-quansync/rolldown'

export default defineConfig({
  workspace: true,
  dts: {
    resolve: ['@antfu/utils'],
  },
  inlineOnly: ['@antfu/utils'],
  exports: true,
  plugins: [
    Quansync(),
  ],
})
