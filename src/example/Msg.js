export default class Msg extends HTMLElement {
    constructor (...args) {
        super(...args)

        this.attachShadow({ mode: 'open' })
        this.shadowRoot.innerHTML = /* HTML */`
            <style>
                :host {
                    display: block;
                    max-height: 30vh;
                    overflow-y: scroll;
                }
                :host details > summary {
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
                :host details[open] > summary {
                    white-space: normal;
                }
            </style>
        `
        const ul = document.createElement('ul')
        this.shadowRoot.appendChild(ul)
        this.msgEventListener = event => {
            const li = document.createElement('li')
            ul.appendChild(li)
            li.innerHTML = /* HTML */`
                <details>
                    <summary>${event.detail.msg}</summary>
                    <div>From PeerId: <span>${event.detail.peer.id}</span></div>
                </details>
            `
            this.scroll(0, this.scrollHeight)
        }
    }

    connectedCallback () {
        document.body.addEventListener('p2pt-msg', this.msgEventListener)
    }

    disconnectedCallback () {
        document.body.removeEventListener('p2pt-msg', this.msgEventListener)
    }
}