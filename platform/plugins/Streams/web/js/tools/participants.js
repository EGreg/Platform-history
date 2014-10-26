(function (Q, $) {

/**
 * @module Streams-tools
 */

/**
 * Displays participants of a given stream in a horizontal list.
 * Each item in the list is presented with an avatar and also can have a contextual associated with it.
 * @class Streams participants
 * @constructor
 * @param {Object} [options] Provide options for this tool
 *   @param {String} [options.publisherId] The id of the publisher
 *   @required
 *   @param {String} [options.streamName] The name of the stream
 *   @required
 *   @param {Number} [options.max]
 *    The number, if any, to show in the denominator of the summary
 *   @optional
 *   @param {Number} [options.maxShow]
 *    The maximum number of participants to fetch for display
 *   @optional
 *   @default 10
 *   @param {Function} [options.filter]
 *    Takes (participant, element) and can modify them.
 *    If this function returns false, the element is not appended.
 *   @optional
 *   @param {Q.Event} [options.onRefresh] An event that occurs when the tool is refreshed
 *   @optional
 */
Q.Tool.define("Streams/participants",

function _Streams_participants(options) {
	
	var tool = this;
	var state = tool.state;
	
	tool.Q.onStateChanged('count').set(function (name) {
		var c = state.count;
		tool.$count.text(c >= 100 ? '99+' : c.toString());
		tool.$summary.plugin('Q/textfill', 'refresh');
	}, tool);
	
	if (!state.rendered) {
		tool.refresh();
	}
	
},

{
	maxShow: null,
	max: null,
    filter: function () { },
	onRefresh: new Q.Event()
},

{
	refresh: function (callback) {
		var tool = this;
		var state = tool.state;
		var $te = $(tool.element);
		var $elements = {};

		tool.$count = $("<span class='Streams_participants_count'></span>");
		tool.$max = $("<span class='Streams_participants_max'></span>");
		tool.$summary = $("<div class='Streams_participants_summary' />")
			.append($('<span />').append(tool.$count, tool.$max))
			.appendTo($te);
		tool.$pc = $("<div class='Streams_participants_container' />")
			.appendTo($te);

		Q.Streams.get(state.publisherId, state.streamName,
		function (err, stream, extra) {
			var fem = Q.firstErrorMessage(err);
			if (fem) {
				return console.warn("Streams/preview: " + fem);
			}
			var stream = tool.stream = this;
			var keys = Object.keys(extra.participants);
			state.count = Object.keys(extra.participants).length;
			tool.stateChanged('count');
			var count = 0;
			Q.each(extra.participants, function (userId, participant) {
				if (state.maxShow) {
					if (++count > state.maxShow) {
						return false;
					}
				}
				if (participant.state !== 'left') {
					prependAvatar(userId);
				}
			}, { sort: 'insertedTime' });
			$te.append($("<div style='clear: both' />"));
			Q.handle(state.onRefresh, tool, []);
			
			setTimeout(function () {
				var w = $te.width() - tool.$summary.outerWidth(true);
				var pm = tool.$pc.outerWidth(true) - tool.$pc.width();
				tool.$pc.width(w - pm);
			}, 0);
			
			if (state.max) {
				tool.$max.text('/' + state.max);
			}
			
			stream.retain(tool).onMessage("Streams/join").set(
			function (stream, message, messages) {
				prependAvatar(message.byUserId);
				++tool.state.count;
				tool.stateChanged('count');
			}, tool);
			
			stream.retain(tool).onMessage("Streams/leave").set(
			function (stream, message, messages) {
				var $element = $elements[message.byUserId];
				if ($element) {
					$element.remove();
				}
				--tool.state.count;
				tool.stateChanged('count');
			}, tool);
			
		}, {participants: 100});
		
		function prependAvatar(userId) {
			var $element = $(Q.Tool.setUpElement('div', 'Users/avatar', {
				userId: userId,
				short: true,
				icon: '40'
			}));
			if (false !== Q.handle(state.filter, tool, [$element])) {
				$elements[userId] = $element;
				$element.prependTo(tool.$pc).activate();
			}
		}
	}
}

);

})(Q, jQuery);