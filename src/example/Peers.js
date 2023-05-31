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
            <div>New Peers: <ul id=new-peers></ul></div>
        `
    this.appendChild(details)
    this.peerconnectEventListener = async event => {
      const peers = event.detail.result ? event.detail.result : await event.detail.peers
      details.querySelector('summary').textContent = peers.length
      if (event.detail._peerId) event.detail._peerId.then(peerId => (details.querySelector('div > span').textContent = peerId))
      details.querySelector('div > ul').innerHTML = peers.reduce((acc, peer) => `${acc}<li>${peer.id}</li>`, '')
      if (event.detail.newPeers) details.querySelector('div > ul#new-peers').innerHTML = event.detail.newPeers.reduce((acc, peer) => `${acc}<li>${peer.id}</li>`, '')
    }
  }

  connectedCallback () {
    document.body.addEventListener('p2pt-peerconnect', this.peerconnectEventListener)
    document.body.addEventListener('p2pt-peerclose', this.peerconnectEventListener)
    document.body.addEventListener('p2pt-peers', this.peerconnectEventListener)
  }

  disconnectedCallback () {
    document.body.removeEventListener('p2pt-peerconnect', this.peerconnectEventListener)
    document.body.removeEventListener('p2pt-peerclose', this.peerconnectEventListener)
    document.body.removeEventListener('p2pt-peers', this.peerconnectEventListener)
  }
}
