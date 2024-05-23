# unconfig

[![NPM version](https://img.shields.io/npm/v/unconfig?color=a1b858&label=)](https://www.npmjs.com/package/unconfig)

A universal solution for loading configurations.

## Why?

Configuration is hard, especially when you want to build an ecosystem of your tools.

You want your tools to be general and easy to use, you allow your config to be defined in a custom field of `package.json`.

You want your tools to be easy to integrate, you allow the configs to be defined in other tools' configurations like `vite.config.js` or `webpack.config.js`.

You want the configs to be agnostic and probably need to be load by IDE, you create new config files like `.myconfigrc`.

You want the configs to also be flexible and dynamic, you make your config files a JavaScript file, like `my.config.js`.

Then you want users to be able to use ESM and TypeScript, you also make your config accepting `.ts` or `.mjs`.

So users' project root end up with a lot of config files like `.npmrc`, `rollup.config.js`, `.eslintrc`, `tsconfig.json`, `jest.config.js`, `postcss.config.js`, `nuxt.config.js`, `vite.config.cjs`, `windi.config.ts`, etc. And each of them use different syntax, in JSON, in CJS, in ESM, in TypeScript, in INI, in TOML...

`unconfig` can't solve this fragmentation entirely, but it's trying to make loading them easier for tool authors.

## Usage

```bash
npm i unconfig
```

For example, to load config for `my.config`:

```js
import { loadConfig } from 'unconfig'

const { config, sources } = await loadConfig({
  sources: [
    // load from `my.config.xx`
    {
      files: 'my.config',
      // default extensions
      extensions: ['ts', 'mts', 'cts', 'js', 'mjs', 'cjs', 'json', ''],
    },
    // load `my` field in `package.json` if no above config files found
    {
      files: 'package.json',
      extensions: [],
      rewrite(config) {
        return config?.my
      },
    },
    // load inline config from `vite.config`
    {
      files: 'vite.config',
      async rewrite(config) {
        const resolved = await (typeof config === 'function' ? config() : config)
        return resolved?.my
      },
    },
    // ...
  ],
  // if false, the only the first matched will be loaded
  // if true, all matched will be loaded and deep merged
  merge: false,
})
```

`unconfig` supports loading `ts`, `mjs`, `js`, `json` by default.

## Sponsors

<p align="center">
  <a href="https://cdn.jsdelivr.net/gh/antfu/static/sponsors.svg">
    <img src='https://cdn.jsdelivr.net/gh/antfu/static/sponsors.svg'/>
  </a>
</p>

## License

[MIT](./LICENSE) License © 2021-PRESENT [Anthony Fu](https://github.com/antfu)
