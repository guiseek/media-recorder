export const select = <S extends string, E extends StrictlyParseSelector<S>>(
  selector: S
): [E] extends [never] ? never : E => {
  return document.querySelector(selector) as E
}

export const selectAll = <S extends string, E extends StrictlyParseSelector<S>>(
  selector: S
): [E] extends [never] ? never : NodeListOf<E> => {
  return document.querySelectorAll(selector)
}

// export const selectAll = <S extends string, E extends StrictlyParseSelector<S>>(
//   selector: S
// ): [E] extends [never] ? never : E => {
//   return document.querySelectorAll(selector) as NodeListOf<E>
// }
