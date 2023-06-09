# Event Driven Web Components P2pt

> [p2pt](https://github.com/subins2000/p2pt) for an event driven architecture.


### Installation and Serving

- git submodule update --init --recursive --remote --force
- npm install
- npm run serve


## TODO
- [x] types and event interfaces
- [x] example demo
- [x] attribute change callback for identifier
- [ ] query parameter for identifier
- [x] dynamic name for identifier "Math.floor(Date.now()/100000)"



### Articles

- [Build an Event Driven TodoMVC App with 8 lightweight VanillaJS Web Components](https://dev.to/weedshaker/build-an-event-driven-todomvc-app-with-8-lightweight-vanillajs-web-components-5b65)
- [DOM and the event driven architecture - Introduction](https://dev.to/weedshaker/dom-and-the-event-driven-architecture-1519)
- [Web Components and now what?](https://dev.to/weedshaker/web-components-and-now-what-k97)


### Support

- [Twitter](https://twitter.com/weedshaker)


## Implementation

Frontend Event Driven Architecture works basically like the DOM itself. There are loosely coupled components (nodes), which emit events and those get captured by other components. They may also emit events on their behalf, which can be consumed.


## Credit

Created by [スィルヴァン aka. Weedshaker](https://github.com/Weedshaker)
