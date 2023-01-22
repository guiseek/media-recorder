export const download = (blob: Blob, input: string, output?: string) => {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.download = output ? output : input
  a.style.display = 'none'
  a.href = url

  document.body.appendChild(a)

  a.click()
  queueMicrotask(() => {
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  })
}
