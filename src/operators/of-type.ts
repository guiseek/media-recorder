import {Observable, filter} from 'rxjs'

export interface IEvent {}

export interface Type<T = any> extends Function {
  new (...args: any[]): T
}

export function ofType<TInput extends IEvent, TOutput extends IEvent>(
  ...types: Type<TOutput>[]
) {
  const isInstanceOf = (event: IEvent): event is TOutput =>
    !!types.find((classType) => event instanceof classType)
  return (source: Observable<TInput>) => source.pipe(filter(isInstanceOf))
}
