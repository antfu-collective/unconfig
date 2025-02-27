import { defineBuildConfig } from 'unbuild'
import Quansync from 'unplugin-quansync/rollup'

export default defineBuildConfig({
  entries: [
    'src/index',
    'src/presets',
  ],
  declaration: true,
  clean: true,
  hooks: {
    'rollup:options': function (ctx, options) {
      options.plugins.push(Quansync())
    },
  },
})
