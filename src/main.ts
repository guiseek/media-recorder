import {setSharedArrayBufferToken} from './set-shared-array-buffer-token'
import {supportedMimeTypes} from './supported-mime-types'
import {createFFmpeg, fetchFile} from '@ffmpeg/ffmpeg'
import {downloadProgress} from './download-progress'
import {combineLatest, fromEvent, map} from 'rxjs'
import {downloadState} from './download-state'
import {errorMessage} from './error-message'
import {HELPER_MESSAGES} from './constants'
import {ofType} from './operators/of-type'
import {getDisplay} from './get-display'
import {Signaling} from './signaling'
import {useState} from './use-state'
import {download} from './download'
import {getUser} from './get-user'
import {select} from './select'
import './style.scss'

setSharedArrayBufferToken(import.meta.env.SHARED_ARRAY_BUFFER_TOKEN)

const control = useState({
  hasOffer: false,
  hasAnswer: false,
  twinPhoton: false,
  iAmZombie: false,
  deviceId: 'default',
  codecPreferences: '',
  source: 'user',
})

let stream: MediaStream
let mediaRecorder: MediaRecorder
let recordedBlobs: Blob[] = []

const dialog = select('dialog#progress')

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

const helper = {
  dialog: select('dialog#help'),
  select<S extends string>(query: S) {
    return select(`dialog#help ${query}`)
  },
  use(opened = true, id = 0) {
    helper.dialog.open = opened
    const {title, description} = HELPER_MESSAGES[id - 1] ?? {}
    if (title) helper.select('span').innerText = title
    if (description) helper.select('p').innerText = description
  },
}

window.helper = helper

const element = {
  codecPreferences: select('select#codecPreferences'),
  playIcon: select(`button#play svg use`),
  twinPhoton: select(`input#twinPhoton`),
  source: select('select#sourceStream'),
  recording: select(`video#recording`),
  recorded: select(`video#recorded`),
  record: select(`button#record`),
  download: select(`a#download`),
  start: select(`button#start`),
  convert: select(`a#convert`),
  play: select(`button#play`),
}

document.head.querySelectorAll('meta').forEach((meta) => {
  if (
    meta.httpEquiv === 'origin-trial' &&
    !import.meta.env.SHARED_ARRAY_BUFFER_TOKEN
  ) {
    element.convert.remove()
  }
})

const setErrorMessage = errorMessage(select('output#errorMsg'))

const details = select('details')

const controller = {
  start: async () => {
    element.start.disabled = true
    const constraints = {
      audio: {echoCancellation: {exact: true}},
      video: {width: 1280, height: 720},
    }
    // console.log('Using media constraints:', constraints)
    const {source} = control.value()
    try {
      if (source === 'display') {
        const media = await getDisplay(constraints)
        handleSuccess(media)

        stream = media
      } else {
        const media = await getUser(constraints)
        handleSuccess(media)

        stream = media
      }
    } catch (e) {
      setErrorMessage(e, 'Erro ao solicitar fluxo do usuário')
    }
  },
  record(mimeType?: string) {
    if (element.record.textContent === 'Comece a gravar') {
      startRecording(mimeType)
      element.recording.hidden = false
      element.recorded.hidden = true
    } else {
      controller.stop()
      element.record.textContent = 'Comece a gravar'
      if (!control.value().iAmZombie) {
        element.play.disabled = false
        downloadState(details, false)
        element.recording.hidden = false
        element.codecPreferences.disabled = false
      }
      element.recorded.hidden = true
    }
  },
  stop() {
    mediaRecorder.stop()
  },
  play() {
    if (element.recorded.currentTime === 0) {
      const [type] = control.value().codecPreferences
      const superBuffer = new Blob(recordedBlobs, {type})

      element.recorded.src = ''
      element.recorded.srcObject = null
      element.recorded.src = URL.createObjectURL(superBuffer)
      element.recorded.controls = false
      element.recording.hidden = true
      element.recorded.hidden = false
      // console.log(element.recorded.currentTime)
    }

    if (element.recorded.paused) {
      element.recorded.play()
      element.playIcon.setAttribute('href', '#icon-pause')
    } else {
      element.recorded.pause()
      element.playIcon.setAttribute('href', '#icon-play')
    }
  },
  download() {
    const blob = new Blob(recordedBlobs, {type: 'video/webm'})
    download(blob, 'video.webm')
  },
  convert: async () => {
    dialog.open = true

    const blob = new Blob(recordedBlobs, {type: 'video/webm'})

    if (!ffmpeg.isLoaded()) await ffmpeg.load()

    ffmpeg.FS('writeFile', 'video.webm', await fetchFile(blob))
    await ffmpeg.run('-i', 'video.webm', '-c:v', 'libx264', 'video.mp4')
    const data = ffmpeg.FS('readFile', 'video.mp4')

    download(
      new Blob([data.buffer], {type: 'video/mp4'}),
      'video.webm',
      'video.mp4'
    )
  },
  twinPhoton() {
    const {twinPhoton} = control.value()

    if (!twinPhoton) {
      control.setState({
        twinPhoton: true,
      })
    }
  },
}

element.codecPreferences.onchange = () => {
  const {value} = element.codecPreferences
  control.setState({codecPreferences: value})
}

element.start.onclick = () => {
  control.setState({source: element.source.value})
  controller.start()
  if (element.twinPhoton.checked) {
    signaling.send({type: 'start'})
  }
}
element.record.onclick = () => {
  const {value} = element.codecPreferences
  const mimeType = value.split(';').shift() ?? ''
  controller.record(mimeType)
  // console.log(mimeType)

  if (element.twinPhoton.checked) {
    signaling.send({type: 'record', message: mimeType})
  }
}
element.play.onclick = () => {
  controller.play()
  if (element.twinPhoton.checked) {
    signaling.send({type: 'play'})
  }
}
element.download.onclick = () => {
  controller.download()
  if (element.twinPhoton.checked) {
    signaling.send({type: 'download'})
  }
}
element.convert.onclick = () => {
  controller.convert()
  if (element.twinPhoton.checked) {
    signaling.send({type: 'convert'})
  }
}
element.twinPhoton.onchange = () => {
  signaling.send({type: 'rachow'})
  control.setState({source: 'display'})
  element.source.value = 'display'
  element.source.disabled = true
}

combineLatest([
  fromEvent(element.codecPreferences, 'change'),
  fromEvent(element.start, 'click'),
  fromEvent(element.record, 'click'),
  fromEvent(element.play, 'click'),
  fromEvent(element.download, 'click'),
  fromEvent(element.convert, 'click'),
  fromEvent(element.twinPhoton, 'click'),
])

fromEvent(element.start, 'click').pipe(
  ofType(PointerEvent),
  map((ev) => {
    // console.log(ev)
    return ev
  })
)
// .subscribe(console.log)

function startRecording(mimeType?: string) {
  recordedBlobs = []

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

  mediaRecorder.onstop = () => {
    console.log('Gravador de mídia criado: ', event)
    console.log('Blobs Gravados: ', recordedBlobs)
  }
  mediaRecorder.ondataavailable = handleDataAvailable
  mediaRecorder.start(1000)
  console.log('Gravador de mídia iniciado', mediaRecorder)
}

function handleSuccess(mediaStream: MediaStream) {
  element.source.disabled = true
  element.start.disabled = true
  console.log('Fluxo de mídia do usuário recebido:', mediaStream)
  stream = mediaStream

  element.recording.srcObject = mediaStream

  supportedMimeTypes().forEach((mimeType) => {
    element.codecPreferences.add(new Option(mimeType, mimeType))
  })

  if (!control.value().iAmZombie) {
    element.record.disabled = false
    element.codecPreferences.disabled = false
  }
}

function handleDataAvailable(event: BlobEvent) {
  console.log('Dados armazenados', event.data)
  if (event.data && event.data.size > 0) {
    recordedBlobs.push(event.data)
  }
}

const signaling = new Signaling<Message>(crypto.randomUUID())

signaling.on = (value) => {
  const {iAmZombie} = control.value()

  switch (value.type) {
    case 'offer': {
      if (!control.value().hasOffer) {
        console.log('recebi oferta e enviei uma resposta')
        control.setState({hasOffer: true})
        signaling.send({type: 'answer'})
      }
      return
    }
    case 'answer': {
      if (!control.value().hasAnswer) {
        console.log('recebi uma resposta')
        control.setState({hasAnswer: true})
        signaling.send({type: 'answer'})
      }
      return
    }
    case 'rachow': {
      console.log('eu sou um zumbi')
      element.source.disabled = true
      element.start.disabled = true
      element.codecPreferences.disabled = true
      element.record.disabled = true
      element.play.disabled = true
      downloadState(details, true)
      const codecPreferences = supportedMimeTypes().shift()
      document.body.classList.add('zombie')
      return control.setState({
        iAmZombie: true,
        codecPreferences,
        source: 'user',
      })
    }
    case 'start': {
      if (iAmZombie) {
        return controller.start()
      }
    }
    case 'play': {
      if (iAmZombie) {
        return controller.play()
      }
    }
    case 'record': {
      console.log(value.message)

      if (iAmZombie) {
        return controller.record(value.message)
      }
    }
    case 'stop': {
      if (iAmZombie) {
        return controller.stop()
      }
    }
    case 'download': {
      if (iAmZombie) {
        return controller.download()
      }
    }
    case 'convert': {
      if (iAmZombie) {
        return controller.convert()
      }
    }
  }
}

control
  .select((state) => state)
  .subscribe((state) => {
    console.log(state)
    const {hasOffer, hasAnswer} = state
    const allRight = hasOffer && hasAnswer
    if (allRight) {
      element.twinPhoton.disabled = false
    }
  })

console.log('enviei uma oferta')
signaling.send({type: 'offer'})
