# ConnexionJS

Emit and listen for events across different frames and execution contexts. Automatically synchronizes event history if any context is attached or created during runtime.

## Installation

In a **Browser** environment include the instance of the ConnexionJS in every frame that should work with events:

```html
<script src="path/to/connexionjs/dist/connexion.min.js"></script>
```

Then in the source code use global variable in the context of a frame

```js
connexion.listen('event', function(){})
connexion.emit('event')
```

In a **CommonJS** environment first install it from NPM:

```
$ npm install connexionjs
```

then in the source code use

```js
	var connexion = require('connexionjs')
	connexion.listen('event', function(){})
	connexion.emit('event')
```

## Usage

Include a library in any window. Start listening and emitting events.

In a main frame

```js
connexion.emit('main-event')
connexion.listen('main-event' , function(eventDetail){
	console.log(eventDetail) //undefined
})
connexion.listen('frame-event' , function(eventDetail){
	console.log(eventDetail) //{a: 1, b: 2}
})
```

In any child frame

```js
connexion.emit('frame-event', {a: 1, b: 2})
connexion.listen('main-event' , function(eventDetail){
	console.log(eventDetail) //undefined
})
connexion.listen('frame-event' , function(eventDetail){
	console.log(eventDetail) //{a: 1, b: 2}
})
```

## API reference:

### `connexion.emit(eventType: String, [eventDetail: Object])`

Emits event with an object attached to it. An event detail is optional.

### `connexion.listen(eventType: String, handler: Function)`

Listens events that are emitted.

### `connexion.observe(eventType: String, handler: Function)`

Observes events that are emitted. Like `connexion.listen()` but additionally calls handler in a moment of attachment with the latest data of event. Suitable for handling of events from the past.

### `connexion.unsubscribe(eventType: String, [handler: Function])`

Removes event handler for a given event type. If handler is not provided then all handlers of a given event type are removed.

### `connexion.version: String`

The version of the library. Sinse the version is important for compatibility between different instancies of ConnexionJS this property can be checked programmatically to see if they match. Versions are compatible if "patch" versions match (e.g. 1.1.x)


## Use cases
- Communiation between **iframes** and **main window** on any direction even across different origins;
- Communication between different tabs/windows of the same origin;
- Communication between different script contexts in browser extensions: background scripts, content scripts, popup scripts;
- Communication between **Node** and **Webkit** context on the Node-Webkit platform;
- Mediator object in a **Browser** web application;
- Mediator object in a **NodeJS** application.


## Compatibility

| Browser            | support |
|--------------------|:-------:|
| self               |    +    |
| frames             |    +    |
| tabs               |    +    |
| workers            |         |

<!--| Electron           | support |
|--------------------|:-------:|
| self               |    +    |
| frames             |    +    |
| tabs               |    +    |-->

| Node-webkit <=0.11 | support |
|--------------------|:-------:|
| self               |    +    |
| frames             |    +    |
| windows            |    -    |
| NodeJS             |    +    |

| NWJS >=0.13        | support |
|--------------------|:-------:|
| self               |    +    |
| frames             |    +    |
| windows            |    +    |
| NodeJS             |    -    |

| Browser extension  | support |
|--------------------|:-------:|
| self               |    +    |
| background         |    +    |
| content            |    +    |
| popup              |    +    |

| NodeJS >=0.8       | support |
|--------------------|:-------:|
| self               |    +    |
| child process      |    -    |
| parallel process   |    -    |

### Polyfills that may be required for old platforms:
- Array `indexOf()` (IE <=8)
- Function `bind()` (IE <=8, FF <=3.6, SF <=5.0.5, CH <6, OP <=11.50)
- `Object.keys()` (IE <=8, FF <=3.6, SF <=4.0.5, OP <=11.50)