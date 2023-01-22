export function supportedMimeTypes() {
  const possibleTypes = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm;codecs=h264,opus',
    'video/mp4;codecs=h264,aac',
  ]
  return possibleTypes.filter((mimeType) => {
    return MediaRecorder.isTypeSupported(mimeType)
  })
}
