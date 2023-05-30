export default class Sent extends HTMLElement {
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
        this.sentEventListener = event => {
            event.detail.forEach(result => {
                const li = document.createElement('li')
                ul.appendChild(li)
                li.innerHTML = /* HTML */`
                    <details>
                        <summary>${result.msg}</summary>
                        <div>To PeerId: <span>${result.peer.id}</span></div>
                    </details>
                `
            })
            this.scroll(0, this.scrollHeight)
        }
    }

    connectedCallback () {
        document.body.addEventListener('p2pt-sent', this.sentEventListener)
    }

    disconnectedCallback () {
        document.body.removeEventListener('p2pt-sent', this.sentEventListener)
    }
}