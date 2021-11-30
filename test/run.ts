import { resolve } from 'path'
import { loadConfig, sourcePackageJsonFields } from '../src'

loadConfig({
  sources: [
    {
      files: 'un.config',
    },
    sourcePackageJsonFields({
      fields: 'un',
    }),
  ],
  cwd: resolve(__dirname, 'fixtures'),
  merge: true,
})
  .then(i => console.log(i))
