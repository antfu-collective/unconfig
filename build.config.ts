import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: [
    'src/index',
    'src/presets',
  ],
  declaration: true,
  clean: true,
})
