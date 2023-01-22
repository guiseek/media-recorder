export const downloadState = (
  details: HTMLDetailsElement,
  state: boolean
) => {
  details.querySelector('summary').ariaDisabled = JSON.stringify(state)
  details.querySelector('a#download').ariaDisabled = JSON.stringify(state)
  details.querySelector('a#convert').ariaDisabled = JSON.stringify(state)
}
