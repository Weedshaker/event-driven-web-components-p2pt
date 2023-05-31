// @ts-check

import './weedshaker-p2pt/dist/p2pt.umd.js'

// https://github.com/subins2000/p2pt/blob/master/api-docs.md#new-p2ptannounceurls---identifierstring--
/**
 * Constructor options
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

/**
 * incoming event
 @typedef {{
  msg: string,
  peer?: *,
  msgId?: number,
  resolve?: (value: Promise<any>) => void
}} SendEventDetail
*/

/**
 * outgoing event
 @typedef {{
  msg: any,
  peer?: any,
  msgID?: number|'',
  sendResult: Promise<any>
}} SentEventDetail
*/

/**
 * incoming event
 @typedef {{
  resolve?: (value: string) => void
}} GetIdentifierEventDetail
*/

/**
 * incoming event
 @typedef {{
  identifierString: string
}} SetIdentifierEventDetail
*/

/**
 * outgoing event
 @typedef {{
  result: string
}} IdentifierEventDetail
*/

/**
 * incoming event
 @typedef {{
  requestMorePeers?: boolean,
  resolve?: (value: Promise<any[]>) => void
}} GetPeersEventDetail
*/

/**
 * outgoing event
 @typedef {{
  WebSocketTracker: *,
  stats: stats
}} TrackerconnectEventDetail
*/

/**
 * outgoing event
 @typedef {{
  Error: *,
  stats: stats
}} TrackerwarningEventDetail
*/

/**
 * outgoing event
 @typedef {{
  peer: *,
  peers: Promise<*[]>,
  _peerId: Promise<string>
}} PeerconnectEventDetail
*/

/**
 * outgoing event
 @typedef {{
  peer: *,
  peers: Promise<*[]>,
  _peerId: Promise<string>
}} PeercloseEventDetail
*/

/**
 * outgoing event
 @typedef {{
  peer: *,
  msg: string|Uint8Array
}} MsgEventDetail
*/

/* global HTMLElement */
/* global CustomEvent */
/* global P2PT */
/* global self */

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
  static get observedAttributes () {
    return ['identifier-string']
  }
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
    this.identifierString = this.getAttribute('identifier-string') || 'weedshakers-event-driven-web-components'

    /** @type {any[]} */
    this._peers = []
    /** @type {stats} */
    this._trackerStats = {
      connected: 0,
      total: 0
    }

    // global events
    this.focusEventListener = event => this.getPeers(true)
    this.beforeunloadEventListener = event => this.p2pt.then(p2pt => p2pt.destroy())
    // custom events
    this.sendEventListener = /** @param {any & {detail: SendEventDetail}} event */ async event => {
      const result = await this.send(event.detail.msg, event.detail.peer, event.detail.msgId)
      if (typeof event?.detail?.resolve === 'function') return event.detail.resolve(result)
      this.dispatchEvent(new CustomEvent(`${this.namespace}sent`, {
        /** @type {SentEventDetail[]} */
        detail: result,
        bubbles: true,
        cancelable: true,
        composed: true
      }))
    }
    // identifier-string
    this.getIdentifierEventListener = /** @param {any & {detail: GetIdentifierEventDetail}} event */ event => {
      if (typeof event?.detail?.resolve === 'function') return event.detail.resolve(this.getIdentifier())
      this.dispatchEvent(new CustomEvent(`${this.namespace}identifier-string`, {
        /** @type {IdentifierEventDetail} */
        detail: {
          result: this.getIdentifier()
        },
        bubbles: true,
        cancelable: true,
        composed: true
      }))
    }
    this.setIdentifierEventListener = /** @param {any & {detail: SetIdentifierEventDetail}} event */ async event => {
      const identifierString = await this.setIdentifier(event.detail.identifierString)
      // must always dispatch an event
      this.dispatchEvent(new CustomEvent(`${this.namespace}identifier-string`, {
        /** @type {IdentifierEventDetail} */
        detail: {
          result: identifierString
        },
        bubbles: true,
        cancelable: true,
        composed: true
      }))
    }
    this.getPeersEventListener = /** @param {any & {detail: GetPeersEventDetail}} event */ event => {
      const resolveValue = this.getPeers(event?.detail.requestMorePeers)
      if (typeof event?.detail?.resolve === 'function') return event.detail.resolve(resolveValue)
      // does not dispatch events, since onPeerconnect and onPeerclose does that part
    }

    /** @type {Promise<import("./p2pt/p2pt").p2pt|any>} */
    this.p2pt = this.init(this.announceUrls, this.identifierString)
  }

  /**
   * initialize P2PT
   *
   * @param {Promise<string[]>} announceUrls
   * @param {string} identifierString
   * @return {Promise<import("./p2pt/p2pt").p2pt|any>}
   */
  async init (announceUrls, identifierString) {
    const p2pt = new P2PT(await announceUrls, identifierString)
    // p2pt events
    p2pt.on('trackerconnect', (WebSocketTracker, stats) => this.onTrackerconnect(WebSocketTracker, stats))
    p2pt.on('trackerwarning', (Error, stats) => this.onTrackerwarning(Error, stats))
    p2pt.on('peerconnect', peer => this.onPeerconnect(peer))
    p2pt.on('peerclose', peer => this.onPeerclose(peer))
    p2pt.on('msg', (peer, msg) => this.onMsg(peer, msg))
    return p2pt
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
    self.addEventListener('beforeunload', this.beforeunloadEventListener, { once: true })
    // custom events
    this.addEventListener(`${this.namespace}send`, this.sendEventListener)
    this.addEventListener(`${this.namespace}get-identifier`, this.getIdentifierEventListener)
    this.addEventListener(`${this.namespace}set-identifier`, this.setIdentifierEventListener)
    this.addEventListener(`${this.namespace}get-peers`, this.getPeersEventListener)
  }

  /**
   * Lifecycle callback, triggered when node is detached from the dom
   * must be here as a placeholder
   *
   * @return {void}
   */
  disconnectedCallback () {
    // global events
    self.removeEventListener('focus', this.focusEventListener)
    self.removeEventListener('beforeunload', this.beforeunloadEventListener, { once: true })
    // custom events
    this.removeEventListener(`${this.namespace}send`, this.sendEventListener)
    this.removeEventListener(`${this.namespace}get-identifier`, this.getIdentifierEventListener)
    this.removeEventListener(`${this.namespace}set-identifier`, this.setIdentifierEventListener)
    this.removeEventListener(`${this.namespace}get-peers`, this.getPeersEventListener)
  }

  attributeChangedCallback (name, oldValue, newValue) {
    if (name === 'identifier-string') this.setIdentifier(newValue, false)
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
      /** @type {TrackerconnectEventDetail} */
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
      /** @type {TrackerwarningEventDetail} */
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
      /** @type {PeerconnectEventDetail} */
      detail: {
        peer,
        peers: this.peers,
        _peerId: this.p2pt.then(p2pt => p2pt._peerId)
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
      /** @type {PeercloseEventDetail} */
      detail: {
        peer,
        peers: this.peers,
        _peerId: this.p2pt.then(p2pt => p2pt._peerId)
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
    this.dispatchEvent(new CustomEvent(`${this.namespace}msg`, {
      /** @type {MsgEventDetail} */
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
   * @param {number|''} [msgID='']
   * @return {Promise<SentEventDetail[]>}
   */
  async send (msg, peer = this.peers, msgID = '') {
    peer = await Promise.resolve(peer)
    if (Array.isArray(peer)) {
      return peer.map(peer => {
        return {
          msg,
          peer,
          msgID,
          sendResult: this.send(msg, peer, msgID)
        }
      })
    }
    return [{
      msg,
      peer,
      msgID,
      sendResult: (await this.p2pt).send(peer, typeof msg === 'string' ? msg : msg.toLocaleString(), msgID)
    }]
  }

  /**
   * Gets the identifier string used to discover peers in the network (room)
   *
   * @return {string}
   */
  getIdentifier () {
    return this.identifierString
  }

  /**
   * Sets the identifier string used to discover peers in the network (room)
   *
   * @param {string} identifierString
   * @param {boolean} [setAttribute=true]
   * @return {Promise<string>}
   */
  async setIdentifier (identifierString, setAttribute = true) {
    this.identifierString = identifierString
    if (setAttribute) this.setAttribute('identifier-string', identifierString)
    return (await (await this.p2pt).setIdentifier(identifierString)) || identifierString
  }

  /**
   * Request More Peers
   *
   * @param {boolean} [requestMorePeers = false]
   * @return {Promise<*[]>}
   */
  async getPeers (requestMorePeers = false) {
    const trackers = requestMorePeers ? await (await this.p2pt).requestMorePeers() : (await this.p2pt).peers
    const peers = this._peers
    for (const key in trackers) {
      if (Object.hasOwnProperty.call(trackers, key)) {
        const tracker = trackers[key]
        for (const key in tracker) {
          if (Object.hasOwnProperty.call(tracker, key)) peers.push(tracker[key])
        }
      }
    }
    return EventDrivenP2pt.filterPeers(peers)
  }

  /**
   * Filter all duplicated peers
   *
   * @static
   * @param {*[]} peers
   * @return {*[]}
   */
  static filterPeers (peers) {
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
   * @param {Promise<string[]>} [existingUrls=Promise.resolve([])]
   * @returns {Promise<string[]>}
   */
  static async setAnnounceURLs (urls, existingUrls = Promise.resolve([])) {
    if (typeof urls === 'string') urls = urls.split(',')
    urls = await Promise.all(urls.map(url => {
      if (url.includes('http')) {
        return fetch(url).then(response => {
        // fetch signaling servers if there is an url to a text list supplied (only supports text yet, if json is need here TODO)
          if (response.status >= 200 && response.status <= 299) return response.text()
          throw new Error(response.statusText)
        }).then(text => {
          const trackers = text.split('\n').filter(text => text)
          if (trackers.length) return trackers
          throw new Error('all entries are empty')
        // @ts-ignore
        }).catch(error => console.warn('Error fetching trackers', error) || '')
      }
      return url
    }))
    return urls.flat().filter(text => {
      if (location.protocol === 'https:' && text.includes('ws:')) return false
      return text
    }).concat(await existingUrls)
  }

  /**
   * Peers
   *
   * @return {Promise<*[]>}
   */
  get peers () {
    return this.getPeers()
  }
}
