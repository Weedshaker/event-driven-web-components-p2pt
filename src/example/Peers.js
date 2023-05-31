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
    this.peerconnectEventListener = async event => {
      const peers = await event.detail.peers
      details.querySelector('summary').textContent = peers.length
      if (event.detail._peerId) event.detail._peerId.then(peerId => (details.querySelector('div > span').textContent = peerId))
      details.querySelector('div > ul').innerHTML = peers.reduce((acc, peer) => `${acc}<li>${peer.id}</li>`, '')
    }

    this.intervalGetPeersId = null
  }

  connectedCallback () {
    document.body.addEventListener('p2pt-peerconnect', this.peerconnectEventListener)
    document.body.addEventListener('p2pt-peerclose', this.peerconnectEventListener)
    this.intervalGetPeersId = setInterval(() => {
      (new Promise(resolve => this.dispatchEvent(new CustomEvent('p2pt-get-peers', {
        /** @type {import("../EventDrivenP2pt.js").RequestMorePeersEventDetail} */
        detail: {
          resolve
        },
        bubbles: true,
        cancelable: true,
        composed: true
      })))).then(peers => this.peerconnectEventListener({ detail: { peers }}))
    }, 10000);
    
  }

  disconnectedCallback () {
    document.body.removeEventListener('p2pt-peerconnect', this.peerconnectEventListener)
    document.body.removeEventListener('p2pt-peerclose', this.peerconnectEventListener)
    clearInterval(this.intervalGetPeersId)
  }
}
