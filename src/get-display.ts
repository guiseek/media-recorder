export const getDisplay = (constraints: MediaStreamConstraints) => {
  return navigator.mediaDevices.getDisplayMedia({
    ...constraints,
    audio: true,
  })
}
