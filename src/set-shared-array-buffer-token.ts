export function setSharedArrayBufferToken(token: string) {
  const meta = document.createElement('meta')
  meta.httpEquiv = 'origin-trial'
  meta.content = token
  document.head.appendChild(meta)
}
