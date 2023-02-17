export function useEventHook<O>(map: Map<any, any>) {
  const pick = <P extends keyof O>(key: P): Callback<O[P]>[] => {
    return map.get(key) ?? []
  }
  const on = <P extends keyof O>(key: P, fn: Callback<O[P]>) => {
    const events = pick(key)
    map.set(key, [...events, fn])
  }
  const emit = <P extends keyof O>(key: P, value: O[P]): void => {
    const events = pick(key)
    events.forEach((fn) => fn(value))
  }
  return {on, emit, pick}
}
