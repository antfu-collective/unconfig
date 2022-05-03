import { resolve } from 'path'
import { expect, it } from 'vitest'
import { loadConfig } from '../src'
import { sourcePackageJsonFields, sourcePluginFactory } from '../src/presets'

it('load', async() => {
  const result = await loadConfig({
    sources: [
      {
        files: 'un.config',
      },
      sourcePackageJsonFields({
        fields: 'un',
      }),
      sourcePluginFactory({
        targetModule: 'stub',
        files: 'rewrite.js',
        extensions: [],
      }),
      sourcePluginFactory({
        targetModule: 'stub',
        files: 'params',
        parameters: ['include me', { param2: 'but not me' }],
      }),
    ],
    cwd: resolve(__dirname, 'fixtures'),
    defaults: {
      defaults: 'default',
      deep: { foo: 'hi' },
    },
    merge: true,
  })

  expect(result.config).toMatchSnapshot()
  expect(result.sources.length).toMatchSnapshot('files')
})
