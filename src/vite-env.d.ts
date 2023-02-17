/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly SHARED_ARRAY_BUFFER_TOKEN: string
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

type MessageType =
  | 'offer'
  | 'answer'
  | 'rachow'
  | 'start'
  | 'play'
  | 'record'
  | 'stop'
  | 'download'
  | 'convert'

interface Message {
  type: MessageType
  message?: string
}

interface Payload<T> {
  name: string
  payload: T
}

type Callback<T> = (value: T) => void
type PredicateFn = (...params: unknown[]) => boolean
type Fn<R = unknown> = (...params: unknown[]) => R
type On<O> = <P extends keyof O>(key: P, fn: Callback<O[P]>) => void
type Emit<O> = <P extends keyof O>(key: P, value: O[P]) => void
type Pick<O> = <P extends keyof O>(key: P) => Callback<O[P]>[]

interface MessageMap {
  offer: RTCSessionDescription
  answer: RTCSessionDescription
  rachow: void
  start: void
  play: void
  stop: void
  download: void
  convert: void
}

interface Window {
  helper: {
    dialog: HTMLDialogElement
    use(): void
  }
}
