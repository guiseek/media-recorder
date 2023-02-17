import {BehaviorSubject} from 'rxjs'

export class Signaling<T extends Message> {
  channel: BroadcastChannel

  private _messages = new BehaviorSubject<T | null>(null)
  readonly messages$ = this._messages.asObservable()

  constructor(private name: string) {
    this.channel = new BroadcastChannel('signaling')
    this.channel.onmessage = ({data}: MessageEvent<Payload<T>>) => {
      this._messages.next(data.payload)
      this._on.forEach((fn) => {
        if (!this.isMe(data.name)) fn(data.payload)
      })
    }
  }

  private _on: Callback<T>[] = []

  public set on(fn: Callback<T>) {
    this._on = [...this._on, fn]
  }

  send<P extends T>(payload: P) {
    this.channel.postMessage({name: this.name, payload})
  }

  isMe(name: string) {
    return this.name === name
  }
}
