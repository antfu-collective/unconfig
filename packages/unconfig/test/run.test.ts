import type { LoadConfigOptions } from '../src'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
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

describe.skip.each([
  'js',
  'ts',
])('config ext: %s', async (ext) => {
  const cwd = resolve(fixtureDir, 'cache')
  const configFileName = `test-${ext}.config`
  const configPath = resolve(cwd, `${configFileName}.${ext}`)
  const { writeFile, mkdir } = await import('@quansync/fs')
  await mkdir(cwd, { recursive: true })

  it('reload', async () => {
    await writeFile(configPath, `export default { value: 'one' }`, 'utf8')
    const result1 = await loadConfig({
      sources: [{ files: configFileName }],
      cwd,
    })
    expect(result1.config).toEqual({
      value: 'one',
    })

    // Mock hot reload by rewriting the config file
    await writeFile(configPath, `export default {
      value: 'two',
    }`, 'utf8')
    const result2 = await loadConfig({
      sources: [{ files: configFileName }],
      cwd,
    })
    expect(result2.config).toEqual({
      value: 'two',
    })
  })

  it('default and named exports', async () => {
    await writeFile(configPath, `export const config = {
      value: 'three',
    }
    export default config`, 'utf8')

    const result = await loadConfig({
      sources: [{ files: configFileName }],
      cwd,
    })

    expect(result.config).toEqual({
      value: 'three',
    })
  })

  it('named exports only', async () => {
    await writeFile(configPath, `export const config1 = {
      value1: 'config-1',
    }
    export const config2 = {
      value2: 'config-2',
    }`, 'utf8')

    const result = await loadConfig({
      sources: [{ files: configFileName }],
      cwd,
    })

    expect(result.config).toEqual({
      config1: {
        value1: 'config-1',
      },
      config2: {
        value2: 'config-2',
      },
    })
  })

  it('default and several named exports', async () => {
    await writeFile(configPath, `export const config1 = {
value1: 'config-1',
}
export const config2 = {
value2: 'config-2',
}
export const config3 = {
value3: 'config-3',
}
export default config3`, 'utf8')

    const result = await loadConfig({
      sources: [{ files: configFileName }],
      cwd,
    })

    expect(result.config).toEqual({
      config1: {
        value1: 'config-1',
      },
      config2: {
        value2: 'config-2',
      },
      value3: 'config-3',
    })
  })

  it('similar export names', async () => {
    await writeFile(configPath, `export const config1 = {
value1: 'config-1',
}
export const config2 = {
value2: 'config-2',
}
export const config3 = {
  config1: 'config-3',
}
export default config3`, 'utf8')

    const result6 = await loadConfig({
      sources: [{ files: configFileName }],
      cwd,
    })

    expect(result6.config).toEqual({
      config1: 'config-3',
      config2: {
        value2: 'config-2',
      },
    })
  })
})

it('custom parser', async () => {
  const cwd = resolve(fixtureDir, 'custom-parser')
  const result = await loadConfig({
    sources: { files: 'config.txt', async parser(filepath) {
      return `custom:${await readFile(filepath, 'utf8')}`
    } },
    cwd,
  })

  expect(result.config).toMatchSnapshot()
})
