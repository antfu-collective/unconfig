import { resolve } from 'path'
import { expect, it } from 'vitest'
import { loadConfig } from '../src'
import { sourcePackageJsonFields, sourcePluginFactory } from '../src/presets'

it('loads the given sources', async() => {
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
    ],
    cwd: resolve(__dirname, 'fixtures'),
    defaults: {
      defaults: 'default',
      deep: { foo: 'hi' },
    },
    merge: true,
  })

  expect(result.config).toMatchSnapshot('config')
  expect(result.sources.length).toMatchSnapshot('files')
  expect(result.sources.map(({ source }) => source)).toMatchSnapshot('sources')
})
