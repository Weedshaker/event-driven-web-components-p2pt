/* global HTMLElement */
/* global CustomEvent */

export default class Sent extends HTMLElement {
  constructor (...args) {
    super(...args)

    this.attachShadow({ mode: 'open' })
    this.shadowRoot.innerHTML = /* HTML */`
            <style>
                
            </style>
        `
    this.input = document.createElement('input')
    this.input.setAttribute('type', 'text')
    this.shadowRoot.appendChild(this.input)
    this.changeEventListener = event => {
      this.dispatchEvent(new CustomEvent('p2pt-send', {
        /** @type {SentEventDetail} */
        detail: {
          msg: this.input.value
        },
        bubbles: true,
        cancelable: true,
        composed: true
      }))
    }
  }

  connectedCallback () {
    this.input.addEventListener('change', this.changeEventListener)
  }

  disconnectedCallback () {
    this.input.removeEventListener('change', this.changeEventListener)
  }
}
