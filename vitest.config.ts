import Quansync from 'unplugin-quansync/vite'
import { defaultClientConditions, defaultServerConditions } from 'vite'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    conditions: ['dev', ...defaultClientConditions],
  },
  environments: {
    ssr: {
      resolve: { conditions: ['dev', ...defaultServerConditions] },
    },
  },
  plugins: [
    Quansync(),
  ],
})
