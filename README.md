# ConnexionJS

Emit and listen for events across different frames and execution contexts. Automatically synchronizes event history if any context is attached or created during runtime.

## How to install

In a **Browser** environment include the instance of the ConnesionJS in every frame that should work with events:

	<script src="path/to/connexionjs/dist/connexion.min.js"></script>

Then in the source code use global variable in the context of a frame

	connexion.listen('event', function(){})
	connexion.emit('event')

In a **Node** environment first install it from NPM:

	$ npm install connexionjs

then in the source code use

	var connexion = require('connexionjs')
	connexion.listen('event', function(){})
	connexion.emit('event')

## Usage

Include a library in any window. Start listening and emitting events.

In a main frame

	connexion.emit('main-event')
	connexion.listen('main-event' , function(eventDetail){
		console.log(eventDetail) //undefined
	})
	connexion.listen('frame-event' , function(eventDetail){
		console.log(eventDetail) //{a: 1, b: 2}
	})
	
In any child frame

	connexion.emit('frame-event', {a: 1, b: 2})
	connexion.listen('main-event' , function(eventDetail){
		console.log(eventDetail) //undefined
	})
	connexion.listen('frame-event' , function(eventDetail){
		console.log(eventDetail) //{a: 1, b: 2}
	})

## API reference:

### connexion.emit(eventType: String, [eventDetail: Object])

Emits event with an object attached to it. An event detail is optional.

### connexion.listen(eventType: String, handler: Function)

Listens events that are emitted.

### connexion.observe(eventType: String, handler: Function)

Observes events that are emitted. Like ``connexion.listen()`` but additionally calls handler in a moment of attachment with the latest data of event. Suitable for handling of events from the past.

### connexion.unsubscribe(eventType: String, [handler: Function])

Removes event handler for a given event type. If handler is not provided then all handlers of a given event type are removed.

### connexion.version: String

The version of the library. Sinse the version is important for compatibility between different instancies of ConnexionJS this property can be checked programmatically to see if they match. Versions are compatible if "patch" versions match (e.g. 1.1.x)


## Use cases
- Communiation between **iframes** and **main window** on any direction even across different origins;
- Communication between **Node** and **Webkit** context on the NWJS platform;
- Mediator object in a **NodeJS** application;
- Mediator object in a **Browser** web application.

## Polyfills that may be required for old platforms:
- Array indexOf() (IE <=8)
- Function bind() (IE <=8, FF <=3.6, SF <=5.0.5, CH <6, OP <11.50)
- Objec.keys() (IE <=8, FF <=3.6, SF <=4.0.5, OP <11.50)