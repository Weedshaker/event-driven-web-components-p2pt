/* global HTMLElement */

export default class Trackers extends HTMLElement {
  constructor (...args) {
    super(...args)

    this.trackerconnectEventListener = event => (this.textContent = JSON.stringify(event.detail.stats))
  }

  connectedCallback () {
    document.body.addEventListener('p2pt-trackerconnect', this.trackerconnectEventListener)
    document.body.addEventListener('p2pt-trackerwarning', this.trackerconnectEventListener)
  }

  disconnectedCallback () {
    document.body.removeEventListener('p2pt-trackerconnect', this.trackerconnectEventListener)
    document.body.removeEventListener('p2pt-trackerwarning', this.trackerconnectEventListener)
  }
}
