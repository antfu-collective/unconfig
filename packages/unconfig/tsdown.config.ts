import { defineConfig } from 'tsdown'
import Quansync from 'unplugin-quansync/rolldown'

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/presets.ts',
  ],
  dts: {
    resolve: ['@antfu/utils'],
  },
  inlineOnly: ['@antfu/utils'],
  exports: true,
  plugins: [
    Quansync(),
  ],
})
