var whenReady = System['import']('../src/index.js')

function exposeGlobal(connexion) {
	window.connexion = connexion
}
function attachAddButtonFunctionality() {
	var button = document.querySelector('button.add')
	if (!button) return
	var iframeName = button.getAttribute('data-iframe')
	button.onclick = function () {
		document.body.insertAdjacentHTML('afterend', '<iframe width=600 height=600 src="' + iframeName + '.html"></iframe>')
	}
}
function attachPushButtonFunctionality() {
	var button = document.querySelector('button.push')
	if (!button) return
	button.onclick = function () {
		connexion.emit(window.name + '-push-event', {from: window.name})
	}
}
function notifyListener(detail, event) {
	console.info(window.name + ' "' + event.type + '"', detail)
}
function notifyObserver(detail, event) {
	console.warn(window.name + ' "' + event.type + '"', detail)
}

whenReady.then(exposeGlobal)
whenReady.then(attachAddButtonFunctionality)
whenReady.then(attachPushButtonFunctionality)