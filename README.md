# unconfig

[![NPM version](https://img.shields.io/npm/v/unconfig?color=a1b858&label=)](https://www.npmjs.com/package/unconfig)

A universal solution for loading configurations.

## Why?

Configuration is hard, especially when you want to build an ecosystem of your tools. 

You want your configs to be general and easy to use, you allow you config to be defined in a custom field of `package.json`.

You want your configs to be easy to integrate, you allow the config to be defined in other tools' configuration file like `vite.config.js` or `webpack.config.js`.

You want your config to be agnostic and probably need to be load by IDE, you create new config files like `.myconfigrc`.

You want your config to be flexible and dynamic, you make your config files a JavaScript file, like `my.config.js`.

You want ESM and TypeScript, you also allow your config file to end with `.ts` or `.mjs`.

So users' project root end up with a lot of config files like `.npmrc`, `rollup.config.js`, `.eslintrc`, `tsconfig.json`, `jest.config.js`, `postcss.config.js`, `nuxt.config.js`, `vite.config.cjs`, `windi.config.ts`, etc. And each of them use different syntax, in JSON, in CJS, in ESM, in TypeScript, in INI, in TOML...

`unconfig` can't solve this entirely, but it's trying to make loading them easier.

## Usage

```bash
npm i unconfig
```

For example, to load config for `my.config`:

```js
import { loadConfig } from 'unconfig'

const { config, filepath } = await loadConfig({
  sources: [
    // load from `unocss.config.xx`
    {
      files: 'my.config',
      // default extensions
      extensions: ['ts', 'mts', 'ctx', 'js', 'mjs', 'cjs', 'json', ''],
    },
    // load `my` field in `package.json` if no above config files found
    {
      files: 'package.json',
      extensions: [],
      rewrite(config) {
        return config?.my
      },
    },
    // load inline config from `nuxt.config`
     {
      files: 'nuxt.config',
      async rewrite(config) {
        const config = await (typeof config === 'function' ? config() : config)
        return config?.my
      },
    },
    // ...
  ],
})
```

## Sponsors

<p align="center">
  <a href="https://cdn.jsdelivr.net/gh/antfu/static/sponsors.svg">
    <img src='https://cdn.jsdelivr.net/gh/antfu/static/sponsors.svg'/>
  </a>
</p>

## License

[MIT](./LICENSE) License © 2021 [Anthony Fu](https://github.com/antfu)
