export const downloadProgress =
  (cb: (value: number) => void) =>
  <T extends Record<string, number>>({time, ratio}: T, duration: number) => {
    let oldValue = 0,
      newValue = 0
    if (time) newValue = (100 * time) / duration
    if (ratio === 1) newValue = 100
    if (newValue > oldValue) cb(newValue)
    oldValue = newValue
  }
