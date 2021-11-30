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
    {
      files: 'rewrite.js',
      extensions: [],
      transform: (source: string) => {
        const moduleName = 'stub'
        const prefix = `
let __unconfig_data;
let __unconfig_stub = function (data) { __unconfig_data = data };
__unconfig_stub.default = (data) => { __unconfig_data = data };
`
        const suffix = 'export default __unconfig_data;'
        let code = source
          .replace(new RegExp(`import (.+?) from (['"])${moduleName}\\2`), 'const $1 = __unconfig_stub;')
          .replace('export default', 'const __unconfig_default = ')
        if (code.includes('__unconfig_default'))
          code += '\nif (typeof __unconfig_default === "function") __unconfig_default();'
        return `${prefix}${code}${suffix}`
      },
    },
  ],
  cwd: resolve(__dirname, 'fixtures'),
  merge: true,
})
  .then(i => console.log(i))
