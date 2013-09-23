Q.Streams.define("SmartApp/cool", function () { // stream constructor
	this.onMove = new Q.Event(); // an event that the stream might trigger
}, {
	someMethod: function () {
		// a method of the stream
	}
});

// this is how you set an event handler to be triggered whenever
// any "SmartApp/move" message is posted to any "SmartApp/cool" stream
Streams.onMessage("SmartApp/cool", "SmartApp/move").set(function (err, message) {
	// trigger our event
	this.onMove.handle(JSON.parse(message.instructions));
}, "SmartApp");