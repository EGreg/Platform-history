(function (Q, $) {

/**
 * @module Streams-tools
 */

/**
 * Displays participants of a given stream in a horizontal list.
 * Each item in the list is presented with an avatar and also can have a contextual associated with it.
 * @class Streams participants
 * @constructor
 * @param {Object} [options] this object contains function parameters
 *   @param {String} [options.publisherId] Publisher ID
 *   @required
 *   @param {String} [options.streamName]  If empty, and <code>creatable</code> is true, then this can be used to add new related Streams/image streams.
 *   @required
 *   @param {Number} [options.max]
 *    The maximum number of participants to display
 *   @optional
 *   @default 10
 *   @param {Function} [options.filter]
 *    Takes (participant, element) and can modify them.
 *    If this function returns false, the element is not appended.
 *   @options
 *   @param {Q.Event} [options.onRefresh] An event that occurs when the icon is refreshed
 *   @optional
 */
Q.Tool.define("Streams/participants",

function(options) {
	
	var tool = this;
	var state = tool.state;
	
	if (!state.rendered) {
		tool.refresh();
	}
	
},

{
	max: 4,
    filter: function () { },
	onRefresh: new Q.Event()
},

{
	refresh: function (callback) {
		var tool = this;
		var state = tool.state;
		var $te = $(tool.element);
		var $elements = {};


		Q.Streams.get(state.publisherId, state.streamName,
		function (err, stream, extra) {
			var fem = Q.firstErrorMessage(err);
			if (fem) {
				return console.warn("Streams/preview: " + fem);
			}
			var stream = tool.stream = this;
			var keys = Object.keys(extra.participants);
			Q.each(extra.participants, function (userId, participant) {
				if (participant.state !== 'left') {
					prependAvatar(userId);
				}
			}, { sort: 'insertedTime' });
			$te.append($("<div style='clear: both' />"));
			Q.handle(state.onRefresh, tool, []);
			
			stream.onMessage("Streams/join").set(
			function (stream, message, messages) {
				prependAvatar(message.byUserId);
			}, tool);
			
			stream.onMessage("Streams/leave").set(
			function (stream, message, messages) {
				var $element = $elements[message.byUserId];
				if ($element) {
					$element.remove();
				}
			}, tool);
			
		}, {participants: state.max});
		
		function prependAvatar(userId) {
			var $element = $(Q.Tool.setUpElement('div', 'Users/avatar', {
				userId: userId,
				short: true,
				icon: '40'
			}));
			if (false !== Q.handle(state.filter, tool, [$element])) {
				$elements[userId] = $element;
				$element.prependTo($te).activate();
			}
		}
	}
}

);

})(Q, jQuery);