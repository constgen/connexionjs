'use strict'

var CrossChannel = require('cross-channel')

var eventChannel = new CrossChannel('connexion-event')
var setupChannel = new CrossChannel('connexion-setup')
var setupResponseChannel = new CrossChannel('connexion-setup-response')

var emitter = require('./emitter.js')
var objectKeys = require('./utils/object-keys.js')

var emitterEmit = emitter.emit

//augment `emit`
emitter.emit = function (type, detail) {
	var event = emitterEmit.call(emitter, type, detail)
	eventChannel.postMessage(event)
	return event
}

function getSubjectsData() {
	var eventSubjects = emitter.subjects
	var eventTypes = objectKeys(emitter.subjects)
	var subject
	var eventType
	var subjectsData = []
	var index = -1

	while (++index in eventTypes) {
		eventType = eventTypes[index]
		subject = eventSubjects[eventType]
		subjectsData.push({
			type: eventType,
			event: subject.value
		})
	}
	return subjectsData
}

function setSubjectsData(messageEvent) {
	var subjectsData = messageEvent.data
	var emitterSubjects = emitter.subjects
	var index = -1
	var data
	var type
	var event
	var subject
	var subjectValue

	while (++index in subjectsData) {
		data = subjectsData[index]
		type = data.type
		event = data.event

		// skip 'wildcard event' declaretion. It will be defined in local instance dinamically by another event.
		if (type === '*') { 
			continue
		}
		// if event was never fired
		else if (!event.timeStamp) { 
			continue
		}
		// if an event is completely new or an event is later than a local event, then emit a newer event to update a value in listeners
		else if (!(type in emitterSubjects)) {
			emitterEmit.call(emitter, event)
		}
		// or an event is later than a local event, then emit a newer event to update a value in listeners
		else {
			subject = emitterSubjects[type]
			subjectValue = subject.value
			if (event.timeStamp > subjectValue.timeStamp) {
				emitter.emit(event)
			}
		}
	}
}

/**
 * Invokes event in a current window.
 */
function emitEvent(messageEvent) {
	var event = messageEvent.data
	//use event object declaretion as a first parameter
	emitterEmit.call(emitter, event)
}

function sendSetupResponse() {
	var setup = getSubjectsData()
	setupResponseChannel.postMessage(setup)
}

function sendSetup() {
	var setup = getSubjectsData()
	setupChannel.postMessage(setup)
}


eventChannel.on('message', emitEvent)
setupChannel.on('message', sendSetupResponse)
setupChannel.on('message', setSubjectsData)
setupResponseChannel.once('message', setSubjectsData)

//send past events to other instances
sendSetup()

module.exports = {}
