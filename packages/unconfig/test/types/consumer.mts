import { createConfigLoader } from 'unconfig'
import 'unconfig/presets'

const loader = createConfigLoader<{ label: string }>({ sources: [] })
const result = loader.load.sync()
const label: string = result.config.label
void label
// @ts-expect-error config.label is a string, not a number
const badLabel: number = result.config.label
void badLabel
const files: string[] = loader.findConfigs.sync()
void files
// @ts-expect-error findConfigs returns string[], not number[]
const badFiles: number[] = loader.findConfigs.sync()
void badFiles
void (async () => {
  const direct = await loader.load(true)
  const directLabel: string = direct.config.label
  void directLabel
  // @ts-expect-error direct load preserves config type
  const badDirectLabel: number = direct.config.label
  void badDirectLabel
})()
void loader.load.async(true)
void loader.load.sync(false)
// @ts-expect-error force is an optional boolean
void loader.load.sync('force')
// @ts-expect-error force is an optional boolean
void loader.load('force')
