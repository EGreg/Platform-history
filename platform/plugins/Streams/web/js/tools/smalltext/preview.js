/*
 * Streams/smalltext/preview tool.
 * Renders a tool to preview (and possibly replace) smalltexts
 * @param options {Object}
 *   A hash of options, which include:
 *   "publisherId": Required.
 *   "streamName": If empty, and "editable" is true, then this can be used to add new related Streams/smalltext streams.
 *   "related": A hash with properties "publisherId" and "streamName", and usually "type"
 *   "editable": Whether the tool should allow authorized users to replace the smalltext
 *   "inplace": Any options to pass to the Q/inplace -- see its options. Must include "showSize".
 *   "onUpdate": A function to execute when the icon is updated
 */
Q.Tool.define("Streams/smalltext/preview", function(options) {
	
	var tool = this;
	Q.Streams.get(tool.state.publisherId, tool.state.streamName, function (err) {
		if (err) {
			return console.warn(err);
		}
	});

},

{
	related: null,
	editable: false,
	inplace: {},
	throbber: "plugins/Q/img/throbbers/spinner_sticky_gray.gif",
	onUpdate: new Q.Event()
},

{
	refresh: function () {
		var tool = this, state = tool.state, stream = this.stream;
		
	}
}

);