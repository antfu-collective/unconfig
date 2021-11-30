import { resolve } from 'path'
import { loadConfig } from '../src'

loadConfig({
  sources: [
    {
      files: [
        'un.config',
      ],
    },
  ],
  cwd: resolve(__dirname, 'fixtures'),
})
  .then(i => console.log(i))
