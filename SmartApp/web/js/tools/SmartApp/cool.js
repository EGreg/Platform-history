Q.Tool.define("SmartApp/cool", function (options) {
	var tool = this;

	if (!state.publisherId || !state.streamName) {
		throw new Q.Exception("publisherId or streamName is required");
	}

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
},

{ // default options here
	publisherId: null,
	streamName: null,
},

{ // methods go here
	
	/**
	 * Example method for this tool
	 * @method getMyStream
	 * @param {Function} callback receives arguments (err) with this = stream
	 */
	getMyStream: function (callback) {
		var state = this.state;
		Q.Streams.get(state.publisherId, state.streamName, callback);
	}
	
});