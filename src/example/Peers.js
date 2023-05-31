/* global HTMLElement */

export default class Peers extends HTMLElement {
  constructor (...args) {
    super(...args)

    const details = document.createElement('details')
    details.innerHTML = /* HTML */`
            <summary></summary>
            <div>Own PeerId: <span></span></div>
            <hr>
            <div>Other Peers: <ul></ul></div>
        `
    this.appendChild(details)
    this.peerconnectEventListener = event => {
      details.querySelector('summary').textContent = event.detail.peers.length
      if (event.detail._peerId) event.detail._peerId.then(peerId => (details.querySelector('div > span').textContent = peerId))
      details.querySelector('div > ul').innerHTML = event.detail.peers.reduce((acc, peer) => `${acc}<li>${peer.id}</li>`, '')
    }
  }

  connectedCallback () {
    document.body.addEventListener('p2pt-peerconnect', this.peerconnectEventListener)
    document.body.addEventListener('p2pt-peerclose', this.peerconnectEventListener);
    (new Promise(resolve => this.dispatchEvent(new CustomEvent('p2pt-request-more-peers', {
      /** @type {import("../EventDrivenP2pt.js").RequestMorePeersEventDetail} */
      detail: {
        resolve
      },
      bubbles: true,
      cancelable: true,
      composed: true
    })))).then(peers => this.peerconnectEventListener({ detail: { peers }}))
    
  }

  disconnectedCallback () {
    document.body.removeEventListener('p2pt-peerconnect', this.peerconnectEventListener)
    document.body.removeEventListener('p2pt-peerclose', this.peerconnectEventListener)
  }
}
