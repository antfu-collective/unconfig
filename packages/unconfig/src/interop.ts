export function interopDefault<T>(mod: T & { default?: T }): T {
  if (mod == null || typeof mod !== 'object' || !('default' in mod) || mod.default == null)
    return mod

  const defaultValue = mod.default

  if (typeof defaultValue !== 'object')
    return defaultValue

  for (const key in mod) {
    try {
      if (key in defaultValue || key === 'default' || (mod as any)[key] === defaultValue)
        continue

      Object.defineProperty(defaultValue, key, {
        configurable: true,
        enumerable: true,
        get() {
          return (mod as any)[key]
        },
      })
    }
    catch {}
  }
  return defaultValue
}
