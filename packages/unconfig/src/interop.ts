export function interopDefault<T>(mod: T & { default?: T }): T {
  if (mod == null || typeof mod !== 'object' || !('default' in mod) || mod.default == null)
    return mod

  const defaultValue = mod.default

  if (typeof defaultValue !== 'object')
    return defaultValue

  for (const key in mod) {
    try {
      if (!(key in defaultValue)) {
        Object.defineProperty(defaultValue, key, {
          enumerable: key !== 'default',
          configurable: key !== 'default',
          get() {
            return (mod as any)[key]
          },
        })
      }
    }
    catch {}
  }
  return defaultValue
}
