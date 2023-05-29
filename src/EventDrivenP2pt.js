// @ts-check

import './p2pt/dist/p2pt.umd.js'

// https://github.com/subins2000/p2pt/blob/master/api-docs.md#new-p2ptannounceurls---identifierstring--
/**
 @typedef {{
    namespace?: string,
    announceUrls?: string,
    identifierString?: string,
 }} options
*/
/**
 * stats
 @typedef {{
    connected: number,
    total: number
  }} stats
*/

 /** @typedef {{
  info: ...
}} ExplEventDetail
*/

/* global ... */

/**
 * As a controller, this component becomes a p2pt
 *
 * @export
 * @class EventDrivenP2pt
 * @attribute {
 *  {string} [namespace='p2pt-']
 *  {string} [announce-urls='https://cdn.jsdelivr.net/gh/ngosang/trackerslist@master/trackers_all_ws.txt,wss://tracker.openwebtorrent.com,wss://tracker.sloppyta.co:443/,wss://tracker.novage.com.ua:443/,wss://tracker.btorrent.xyz:443/'] https://github.com/subins2000/p2pt/blob/master/api-docs.md#new-p2ptannounceurls---identifierstring--
 *  {string} [identifier-string='weedshakers-event-driven-web-components-p2pt-example'] https://github.com/subins2000/p2pt/blob/master/api-docs.md#new-p2ptannounceurls---identifierstring--
 * }
 */
export const EventDrivenP2pt = (ChosenHTMLElement = HTMLElement) => class EventDrivenP2pt extends ChosenHTMLElement {
  /**
   * Creates an instance of EventDrivenP2pt. The constructor will be called for every custom element using this class when initially created.
   *
   * @param {options} [options = {namespace= undefined, announceUrls: undefined, identifierString: undefined}]
   * @param {*} args
   */
  constructor (options = { namespace: undefined, announceUrls: undefined, identifierString: undefined }, ...args) {
    // @ts-ignore
    super(...args)

    if (typeof options.namespace === 'string') this.setAttribute('namespace', options.namespace)
    /** @type {string} */
    this.namespace = this.getAttribute('namespace') || 'p2pt-'

    if (typeof options.announceUrls === 'string') this.setAttribute('announce-urls', options.announceUrls)
    /** @type {Promise<string[]>} */
    this.announceUrls = this.getAttribute('announce-urls') || 'https://cdn.jsdelivr.net/gh/ngosang/trackerslist@master/trackers_all_ws.txt,wss://tracker.openwebtorrent.com,wss://tracker.sloppyta.co:443/,wss://tracker.novage.com.ua:443/,wss://tracker.btorrent.xyz:443/'
  
    if (typeof options.identifierString === 'string') this.setAttribute('identifier-string', options.identifierString)
    /** @type {string} */
    this.identifierString = this.getAttribute('identifier-string') || 'weedshakers-event-driven-web-components-p2pt'

    this._peers = []
    /** @type {stats} */
    this._trackerStats = {
      'connected': 0,
      'total': 0
    }

    // global events
    this.focusEventListener = event => {
      this.connectedCallback()
      this.requestMorePeers()
    }
    this.beforeunloadEventListener = event => this.disconnectedCallback()
    // custom events
    this.sendEventListener = event => {
      const resolveValue = this.send(event.detail.msg, event.detail.peer, event.detail.msgId)
      if (typeof event?.detail?.resolve === 'function') return event.detail.resolve(resolveValue)
    }
    this.setIdentifierEventListener = event => this.setIdentifier(event.detail.identifierString)
    this.requestMorePeersEventListener = event => {
      const resolveValue = this.requestMorePeers()
      if (typeof event?.detail?.resolve === 'function') return event.detail.resolve(resolveValue)
    }

    /** @type {Promise<import("./p2pt/p2pt").p2pt|any>}*/
    this.p2pt = new Promise(resolve => this.init(this.announceUrls, this.identifierString, resolve))
  }

  /**
   * initialize P2PT
   *
   * @param {Promise<string[]>} announceUrls
   * @param {string} identifierString
   * @param {(any)=>void} resolve
   * @return {Promise<void>}
   */
  async init (announceUrls, identifierString, resolve) {
    let p2pt
    resolve(p2pt = new P2PT(await announceUrls, identifierString))
    // p2pt events
    p2pt.on('trackerconnect', (WebSocketTracker, stats) => this.onTrackerconnect(WebSocketTracker, stats))
    p2pt.on('trackerwarning', (Error, stats) => this.onTrackerwarning(Error, stats))
    p2pt.on('peerconnect', peer => this.onPeerconnect(peer))
    p2pt.on('peerclose', peer => this.onPeerclose(peer))
    p2pt.on('msg', (peer, msg) => this.onMsg(peer, msg))
  }

  /**
   * Lifecycle callback, triggered when node is attached to the dom
   * must be here as a placeholder
   *
   * @return {void}
   */
  connectedCallback () {
    this.p2pt.then(p2pt => p2pt.start())
    // global events
    self.addEventListener('focus', this.focusEventListener)
    self.addEventListener('beforeunload', this.beforeunloadEventListener, {once: true})
    // custom events
    this.addEventListener(`${this.namespace}send`, this.sendEventListener)
    this.addEventListener(`${this.namespace}set-identifier`, this.setIdentifierEventListener)
    this.addEventListener(`${this.namespace}request-more-peers`, this.requestMorePeersEventListener)
  }

  /**
   * Lifecycle callback, triggered when node is detached from the dom
   * must be here as a placeholder
   *
   * @return {void}
   */
  disconnectedCallback () {
    this.p2pt.then(p2pt => p2pt.destroy())
    // global events
    self.removeEventListener('focus', this.focusEventListener)
    self.removeEventListener('beforeunload', this.beforeunloadEventListener, {once: true})
    // custom events
    this.removeEventListener(`${this.namespace}send`, this.sendEventListener)
    this.removeEventListener(`${this.namespace}set-identifier`, this.setIdentifierEventListener)
    this.removeEventListener(`${this.namespace}request-more-peers`, this.requestMorePeersEventListener)
  }

  /**
   * This event is emitted when a successful connection to tracker is made.
   *
   * @param {*} WebSocketTracker
   * @param {stats} stats
   * @return {void}
   */
  onTrackerconnect (WebSocketTracker, stats) {
    this._trackerStats = stats
    this.dispatchEvent(new CustomEvent(`${this.namespace}trackerconnect`, {
      detail: {
        WebSocketTracker,
        stats
      },
      bubbles: true,
      cancelable: true,
      composed: true
    }))
  }

  /**
   * This event is emitted when some error happens with connection to tracker.
   *
   * @param {*} Error
   * @param {stats} stats
   * @return {void}
   */
  onTrackerwarning (Error, stats) {
    this._trackerStats = stats
    this.dispatchEvent(new CustomEvent(`${this.namespace}trackerwarning`, {
      detail: {
        Error,
        stats
      },
      bubbles: true,
      cancelable: true,
      composed: true
    }))
  }
  
  /**
   * This event is emitted when a new peer connects.
   *
   * @param {*} peer
   * @return {void}
   */
  onPeerconnect (peer) {
    this._peers.push(peer)
    this.dispatchEvent(new CustomEvent(`${this.namespace}peerconnect`, {
      detail: {
        peer,
        peers: this._peers
      },
      bubbles: true,
      cancelable: true,
      composed: true
    }))
  }

  /**
   * This event is emitted when a peer disconnects.
   *
   * @param {*} peer
   * @return {void}
   */
  onPeerclose (peer) {
    this._peers.splice(this._peers.indexOf(peer), 1)
    this.dispatchEvent(new CustomEvent(`${this.namespace}peerclose`, {
      detail: {
        peer,
        peers: this._peers
      },
      bubbles: true,
      cancelable: true,
      composed: true
    }))
  }

  /**
   * This event is emitted once all the chunks are received for a message.
   *
   * @param {*} peer
   * @param {string|Uint8Array} msg
   * @return {any}
   */
  onMsg (peer, msg) {
    console.log(`Got message from ${peer.id} : ${msg}`)
    this.dispatchEvent(new CustomEvent(`${this.namespace}msg`, {
      detail: {
        peer,
        msg
      },
      bubbles: true,
      cancelable: true,
      composed: true
    }))
  }

  /**
   * send message
   *
   * @param {any} msg
   * @param {*} [peer=this.peers]
   * @param {string} [msgID='']
   * @param {boolean} [dispatchEvent=true]
   * @return {Promise<any>}
   */
  async send (msg, peer = this.peers, msgID = '', dispatchEvent = true) {
    console.log('send', msg, peer)
    peer = await Promise.resolve(peer)
    if (Array.isArray(peer)) {
      const result = peer.map(peer => this.send(msg, peer, msgID, false))
      if (dispatchEvent) this.dispatchEvent(new CustomEvent(`${this.namespace}send`, {
        detail: {
          result
        },
        bubbles: true,
        cancelable: true,
        composed: true
      }))
      return result
    }
    const result = (await this.p2pt).send(peer, typeof msg === 'string' ? msg : msg.toLocaleString(), msgID)
    if (dispatchEvent) this.dispatchEvent(new CustomEvent(`${this.namespace}send`, {
      detail: {
        result
      },
      bubbles: true,
      cancelable: true,
      composed: true
    }))
    return result
  }

  /**
   * Sets the identifier string used to discover peers in the network (room)
   *
   * @param {string} identifierString
   * @return {void}
   */
  setIdentifier (identifierString) {
    this.identifierString = identifierString
    this.setAttribute('identifier-string', identifierString)
    this.p2pt.then(p2pt => {
      p2pt.setIdentifier(identifierString)
      this.dispatchEvent(new CustomEvent(`${this.namespace}set-identifier`, {
        detail: {
          identifierString
        },
        bubbles: true,
        cancelable: true,
        composed: true
      }))
    })
  }

  /**
   * Request More Peers
   *
   * @return {Promise<*[]>}
   */
  async requestMorePeers () {
    const trackers = await (await this.p2pt).requestMorePeers()
    const peers = this._peers
    for (const key in trackers) {
      if (Object.hasOwnProperty.call(trackers, key)) {
        const tracker = trackers[key]
        for (const key in tracker) {
          if (Object.hasOwnProperty.call(tracker, key)) peers.push(tracker[key])
        }
      }
    }
    const ids = []
    return peers.filter(peer => {
      const isDouble = ids.includes(peer.id)
      ids.push(peer.id)
      return !isDouble
    })
  }

  /**
   * get all announce urls
   *
   * @return {Promise<string[]>}
   */
  get announceUrls () {
    return this._announceUrls || Promise.resolve([])
  }
  
  /**
   * set/add more announce urls
   * @param {string|string[]|any} urls
   */
  set announceUrls (urls) {
    if (!urls) {
      this._announceUrls = Promise.resolve([])
    } else {
      /** @type {Promise<string[]>} */
      this._announceUrls = EventDrivenP2pt.setAnnounceURLs(urls, this._announceUrls)
    }
  }

  /**
   * Fetch if the path includes http and not wss
   *
   * @static
   * @param {string|string[]|any} urls
   * @param {Promise<string[]>} [existingUrls=[]]
   * @returns {Promise<string[]>}
   */
  static async setAnnounceURLs (urls, existingUrls = []) {
    if (typeof urls === 'string') urls = urls.split(',')
    urls = await Promise.all(urls.map(url => {
      if (url.includes('http')) return fetch(url).then(response => {
        // fetch signaling servers if there is an url to a text list supplied (only supports text yet, if json is need here TODO)
          if (response.status >= 200 && response.status <= 299) return response.text()
          throw new Error(response.statusText)
        }).then(text => {
          const trackers = text.split('\n').filter(text => text)
          if (trackers.length) return trackers
          throw new Error('all entries are empty')
        }).catch(error => '')
      return url
    }))
    return urls.flat().filter(text => text).concat(await existingUrls)
  }

  /**
   * Peers
   *
   * @return {Promise<*[]>}
   */
  get peers () {
    return this.requestMorePeers()
  }
}