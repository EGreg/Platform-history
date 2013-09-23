Q.Tool.define("SmartApp/cool", function () { // tool constructor
	var tool = this; // use tool.options, tool.element, tool.prefix

	Q.addStylesheet("css/html.css"); // add any css you need
	
	// set up some event handlers
	this.getMyStream(function (err) {
		if (err) return;
		var stream = this;
		stream.onMove().set(function (err, message) {
			// do something here
		}, this); // handler will be auto-removed when this tool is removed
	});
	
	this.onMove = new Q.Event(); // an event that the stream might trigger
}, {
	getMyStream: function (callback) {
		// example method for the tool
		Q.Streams.get(
			this.options.publisherId, 
			this.options.streamName,
			callback
		);
	}
});