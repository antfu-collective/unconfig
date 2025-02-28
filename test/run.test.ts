import type { LoadConfigOptions } from '../src'
import { resolve } from 'node:path'
import { expect, it } from 'vitest'
import { loadConfig, loadConfigSync } from '../src'
import { sourcePackageJsonFields, sourcePluginFactory } from '../src/presets'

const fixtureDir = resolve(__dirname, 'fixtures')

it('one', async () => {
  const cwd = resolve(fixtureDir, 'one')
  const options: LoadConfigOptions = {
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
        files: 'rewrite2.js',
        extensions: [],
      }),
      sourcePluginFactory({
        targetModule: 'stub',
        files: 'params',
        parameters: ['include me', { param2: 'but not me' }],
      }),
    ],
    cwd,
    defaults: {
      defaults: 'default',
      deep: { foo: 'hi' },
    },
    merge: true,
  }
  const asyncResult = await loadConfig(options)
  const syncResult = loadConfigSync(options)
  delete syncResult.config.__esModule

  expect(syncResult).toEqual(asyncResult)
  expect(asyncResult.config)
    .toMatchSnapshot()

  expect(asyncResult.sources.map(i => i.slice(cwd.length + 1)))
    .toMatchSnapshot('files')
})

it('two', async () => {
  const cwd = resolve(fixtureDir, 'two')
  const result = await loadConfig({
    sources: [
      {
        files: 'lodash-es',
      },
    ],
    cwd,
    merge: true,
  })

  expect(result.config)
    .toMatchSnapshot()

  expect(result.sources.map(i => i.slice(cwd.length + 1)))
    .toMatchSnapshot('files')
})

// https://github.com/antfu/unconfig/issues/26
it('array', async () => {
  const cwd = resolve(fixtureDir, 'array')
  const result = await loadConfig({
    sources: [
      {
        files: 'foo.config',
      },
    ],
    cwd,
  })

  expect(result.config)
    .toMatchSnapshot()
})
