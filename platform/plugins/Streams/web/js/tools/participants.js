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

		var $count = $("<span class='Streams_participants_count'></span>");
		var $max = $("<span class='Streams_participants_max'></span>");
		var $summary = $("<div class='Streams_participants_summary' />")
			.append($('<span />').append($count, $max))
			.appendTo($te);
		var $pc = $("<div class='Streams_participants_container' />")
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
			_refreshCount();
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
				var w = $te.width() - $summary.outerWidth(true);
				var pm = $pc.outerWidth(true) - $pc.width();
				$pc.width(w - pm);
			}, 0);
			
			if (state.max) {
				$max.text('/' + state.max);
			}
			
			stream.onMessage("Streams/join").set(
			function (stream, message, messages) {
				prependAvatar(message.byUserId);
				++tool.state.count;
				_refreshCount();
			}, tool);
			
			stream.onMessage("Streams/leave").set(
			function (stream, message, messages) {
				var $element = $elements[message.byUserId];
				if ($element) {
					$element.remove();
				}
				--tool.state.count;
				_refreshCount();
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
				$element.prependTo($pc).activate();
			}
		}
		
		function _refreshCount() {
			var c = state.count;
			tool.stateChanged('count');
			$count.text(c >= 100 ? '99+' : c.toString());
			$summary.plugin('Q/textfill', 'refresh');
		}
	}
}

);

})(Q, jQuery);