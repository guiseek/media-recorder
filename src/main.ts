import {setSharedArrayBufferToken} from './set-shared-array-buffer-token'
import {supportedMimeTypes} from './supported-mime-types'
import {createFFmpeg, fetchFile} from '@ffmpeg/ffmpeg'
import {downloadProgress} from './download-progress'
import {downloadState} from './download-state'
import {errorMessage} from './error-message'
import {getDisplay} from './get-display'
import {filter, fromEvent} from 'rxjs'
import {download} from './download'
import {getUser} from './get-user'
import {select} from './select'
import './style.scss'

setSharedArrayBufferToken(import.meta.env.SHARED_ARRAY_BUFFER_TOKEN)

let stream: MediaStream
let mediaRecorder: MediaRecorder
let recordedBlobs: Blob[] = []

const dialog = select('dialog')

const ffmpeg = createFFmpeg({
  log: false,
  progress: (params) => {
    downloadProgress((value) => {
      dialog.querySelector('progress').value = value
      dialog.querySelector('var').textContent = `${value.toFixed(0)}%`
      if (value === 100) setTimeout(() => (dialog.open = false), 1000)
    })(params, recordedBlobs.length)
  },
})

const element = {
  codecPreferences: select('select#codecPreferences'),
  playIcon: select(`button#play svg use`),
  source: select('select#sourceStream'),
  recording: select(`video#recording`),
  recorded: select(`video#recorded`),
  record: select(`button#record`),
  download: select(`a#download`),
  start: select(`button#start`),
  convert: select(`a#convert`),
  play: select(`button#play`),
}

const setErrorMessage = errorMessage(select('output#errorMsg'))

const details = select('details')

fromEvent(element.record, 'click').subscribe(() => {
  if (element.record.textContent === 'Comece a gravar') {
    startRecording()
    element.recording.hidden = false
    element.recorded.hidden = true
  } else {
    stopRecording()
    element.record.textContent = 'Comece a gravar'
    element.play.disabled = false
    downloadState(details, false)
    element.recording.hidden = false
    element.recorded.hidden = true
    element.codecPreferences.disabled = false
  }
})

fromEvent(element.play, 'click').subscribe(() => {
  if (element.recorded.currentTime === 0) {
    const [type] = element.codecPreferences.value.split(';', 1)

    const superBuffer = new Blob(recordedBlobs, {type})

    element.recorded.src = ''
    element.recorded.srcObject = null
    element.recorded.src = URL.createObjectURL(superBuffer)
    element.recorded.controls = false
    element.recording.hidden = true
    element.recorded.hidden = false
    console.log(element.recorded.currentTime)
  }

  if (element.recorded.paused) {
    element.recorded.play()
    element.playIcon.setAttribute('href', '#icon-pause')
  } else {
    element.recorded.pause()
    element.playIcon.setAttribute('href', '#icon-play')
  }
})

function startRecording() {
  recordedBlobs = []
  const mimeType = element.codecPreferences.value

  try {
    mediaRecorder = new MediaRecorder(stream, {mimeType})
  } catch (e) {
    setErrorMessage(e, 'Exceção ao criar o gravador de mídia')
    return
  }

  console.log('Gravador de mídia criado', mediaRecorder, 'with options', {
    mimeType,
  })

  element.record.textContent = 'Pare de gravar'
  element.codecPreferences.disabled = true
  element.source.disabled = true
  element.play.disabled = true
  downloadState(details, true)

  mediaRecorder.onstop = (event) => {
    console.log('Gravador de mídia criado: ', event)
    console.log('Blobs Gravados: ', recordedBlobs)
  }
  mediaRecorder.ondataavailable = handleDataAvailable
  mediaRecorder.start(1000)
  console.log('Gravador de mídia iniciado', mediaRecorder)
}

function handleSuccess(mediaStream: MediaStream) {
  element.record.disabled = false
  element.source.disabled = true
  console.log('Fluxo de mídia do usuário recebido:', mediaStream)
  stream = mediaStream

  element.recording.srcObject = mediaStream

  supportedMimeTypes().forEach((mimeType) => {
    element.codecPreferences.add(new Option(mimeType, mimeType))
  })
  element.codecPreferences.disabled = false
}

fromEvent(element.download, 'click')
  .pipe(filter(() => element.download.ariaDisabled === 'false'))
  .subscribe(() => {
    const blob = new Blob(recordedBlobs, {type: 'video/webm'})
    download(blob, 'test.webm')
  })

fromEvent(element.convert, 'click')
  .pipe(filter(() => element.convert.ariaDisabled === 'false'))
  .subscribe(async () => {
    dialog.open = true

    const blob = new Blob(recordedBlobs, {type: 'video/webm'})

    if (!ffmpeg.isLoaded()) await ffmpeg.load()

    ffmpeg.FS('writeFile', 'test.webm', await fetchFile(blob))
    await ffmpeg.run('-i', 'test.webm', 'test.mp4')
    const data = ffmpeg.FS('readFile', 'test.mp4')

    download(
      new Blob([data.buffer], {type: 'video/mp4'}),
      'test.webm',
      'test.mp4'
    )
  })

function handleDataAvailable(event: BlobEvent) {
  console.log('Dados armazenados', event.data)
  if (event.data && event.data.size > 0) {
    recordedBlobs.push(event.data)
  }
}

function stopRecording() {
  mediaRecorder.stop()
}

async function init(constraints: MediaStreamConstraints) {
  try {
    if (element.source.value === 'display') {
      getDisplay(constraints).then(handleSuccess)
    } else {
      getUser(constraints).then(handleSuccess)
    }
  } catch (e) {
    setErrorMessage(e, 'Erro ao solicitar fluxo do usuário')
  }
}

element.start.onclick = async () => {
  element.start.disabled = true
  const constraints = {
    audio: {echoCancellation: {exact: true}},
    video: {width: 1280, height: 720},
  }
  console.log('Using media constraints:', constraints)
  await init(constraints)
}
