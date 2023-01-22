export const errorMessage =
  <E extends HTMLElement>(errorElement: E) =>
  (e: unknown, prefix = '') => {
    console.error(e)
    errorElement.innerHTML = !!prefix ? `${prefix}: ` : '' + JSON.stringify(e)
  }
