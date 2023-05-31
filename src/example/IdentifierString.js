/* global HTMLElement */

export default class IdentifierString extends HTMLElement {
  constructor (...args) {
    super(...args)

    this.identifierStringEventListener = event => (this.textContent = event.detail.result)
  }

  connectedCallback () {
    document.body.addEventListener('p2pt-identifier-string', this.identifierStringEventListener)
  }

  disconnectedCallback () {
    document.body.removeEventListener('p2pt-identifier-string', this.identifierStringEventListener)
  }
}
