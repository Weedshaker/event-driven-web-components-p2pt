// @ts-check

// https://github.com/subins2000/p2pt/blob/master/api-docs.md#new-p2ptannounceurls---identifierstring--
/** @typedef {{
      name: string,
      path: string,
      regExp: RegExp,
      component?: HTMLElement
    }} options
 */

 /** @typedef {{
  info: Promise<{ route: Route, location: string, rendered: boolean } | TypeError>
}} SendEventDetail
*/

/* global ... */

/**
 * As a controller, this component becomes a p2pt
 *
 * @export
 * @class P2pt
 * @attribute {
 *  {string} [announce-urls='https://cdn.jsdelivr.net/gh/ngosang/trackerslist@master/trackers_all_ws.txt,wss://tracker.openwebtorrent.com,wss://tracker.sloppyta.co:443/,wss://tracker.novage.com.ua:443/,wss://tracker.btorrent.xyz:443/'] https://github.com/subins2000/p2pt/blob/master/api-docs.md#new-p2ptannounceurls---identifierstring--
 *  {string} [identifier-string='weedshakers-event-driven-web-components-p2pt-example'] https://github.com/subins2000/p2pt/blob/master/api-docs.md#new-p2ptannounceurls---identifierstring--
 * }
 */
export const P2pt = (ChosenHTMLElement = HTMLElement) => class P2pt extends ChosenHTMLElement {
  /**
   * Creates an instance of P2pt. The constructor will be called for every custom element using this class when initially created.
   *
   * @param {{announceUrls?: string | undefined, identifierString?: string | undefined}} [options = {announceUrls: undefined, identifierString: undefined}]
   * @param {*} args
   */
  constructor (options = { announceUrls: undefined, identifierString: undefined }, ...args) {
    // @ts-ignore
    super(...args)

    if (typeof options.announceUrls === 'string') this.setAttribute('announce-urls', options.announceUrls)
    /** @type {string} */
    this.announceUrls = this.getAttribute('announce-urls') || 'https://cdn.jsdelivr.net/gh/ngosang/trackerslist@master/trackers_all_ws.txt,wss://tracker.openwebtorrent.com,wss://tracker.sloppyta.co:443/,wss://tracker.novage.com.ua:443/,wss://tracker.btorrent.xyz:443/'
  
    if (typeof options.identifierString === 'string') this.setAttribute('identifier-string', options.identifierString)
    /** @type {string} */
    this.identifierString = this.getAttribute('identifier-string') || 'weedshakers-event-driven-web-components-p2pt'
  }

  /**
   * Lifecycle callback, triggered when node is attached to the dom
   * must be here as a placeholder
   *
   * @return {void}
   */
  connectedCallback () {}

  /**
   * Lifecycle callback, triggered when node is detached from the dom
   * must be here as a placeholder
   *
   * @return {void}
   */
  disconnectedCallback () {}

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
    if (!urls) this._announceUrls = Promise.resolve([])
    /** @type {Promise<string[]>} */
    this._announceUrls = P2pt.setAnnounceURLs(urls, this._announceUrls)
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
}
