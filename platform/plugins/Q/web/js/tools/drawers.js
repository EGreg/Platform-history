(function (Q, $) {
/**
 * @module Q-tools
 */
	
/**
 * Implements vertical drawers that work on most modern browsers,
 * including ones on touchscreens.
 * @class Q fixed
 * @constructor
 * @param {Object}   [options] Override various options for this tool
 * @return Q.Tool
 */
Q.Tool.define("Q/drawers", function(options) {
	var tool = this;
	var state = tool.state;
	state.drawers = [];
	state.switchCount = 0;

	$(this.element).children().each(function () {
		state.drawers.push(this);
	});
	this.switchTo(state.initial.index);
},

{
	initial: {
		duration: 300,
		easing: 'easeOutBack',
		index: 1
	},
	transition: {
		duration: 300,
		easing: 'swing'
	},
	container: null,
	width: function () { return $(this.element).width() },
	height: function () {
		var result;
		$(this.element).parents().each(function () {
			var $this = $(this);
			var overflow = $this.css('overflow');
			if (['hidden', 'visible'].indexOf(overflow) < 0) {
				result = this.clientHeight;
				return false;
			}
		});
		return result;
	},
	currentIndex: null,
	heights: [100, 100],
	behind: [true, false],
	fullscreen: Q.info.isMobile && Q.info.isAndroid(1000)
},

{
	/**
	 * Animated resizing to fill a specified area
	 * By default, it toggles between original size and fullscreen.
	 * @method expand
	 * @param {Object} options
	 * @param {Number} [options.width] 
	 * @param {Number} [options.height]
	 * @param {Number} [options.duration]
	 * @param {Number} [options.ease]
	 */
    resize: function (options) {
		
    },
	
	switchTo: function (index) {
		var tool = this;
		var state = tool.state;
		if (state.currentIndex == index) return;
		var $drawer = $(state.drawers[index]);
		var sWidth = typeof state.width === 'function' 
			? state.width.call(tool, index) : state.width;
		var sHeights = typeof state.heights === 'function' 
			? state.heights.call(tool, index) : state.heights;
		var sHeight = typeof state.width === 'function' 
			? state.height.call(tool) : state.height;
		
		if (state.switchCount == 0) {
			_pin(1-index);
		} else if (index) {
			_pin(0);
			$(state.$placeholder).animate({
				height: sHeights[1-index]
			});
		} else {
			$(state.$placeholder).animate({
				height: sHeight - sHeights[1-index]
			}, function () {
				_pin(1);
			});
		}
		state.currentIndex = index;
		
		function _pin(index) {
			var $pe;
			var p = state.originalPosition;
			var w = state.originalWidth;
			var h = state.originalHeight;
	
			$element = $(state.drawers[index]);
			state.originalPosition = $element.css('position');
			$element.css('position', 'relative');
			state.originalWidth = $element.width();
			state.originalHeight = $element.height();
			state.originalOffset = $element.offset();
	
			if (state.pinnedElement) {
				$pe = $(state.pinnedElement);
				state.$placeholder.before($pe).remove();
				$pe.css({
					position: p,
					width: w,
					height: h,
					left: 0,
					top: 0
				});
			}
			state.pinnedElement = $element[0];

			state.$placeholder = $('<div class="Q_drawers_placeholder" style="background: transparent;" />')
			.width(sWidth)
			.height(sHeights[index])
			.insertAfter($element);

			var $te = $(tool.element);
			var $p = $element.parents();
			var $p2 = state.container ? $te.closest(state.container) : $p.eq(-3);
			$p.each(function () {
				var $this = $(this);
				$this.css('background', 'transparent');
				if ($this.is(state.container)) return false;
			});
			$element['insert'+(state.behind[index]?'Before':'After')]($p2)
			.css({
				position: state.fullscreen ? 'fixed' : 'absolute',
				width: sWidth,
				'z-index': $p2.css('z-index')
			}).offset(state.originalOffset);
	
			Q.addScript("plugins/Q/js/jquery.easing.min.js", function () {
				var eventName = Q.info.isTouchscreen
					? 'touchstart'
					: 'mouseenter';
				var k = state.switchCount ? 'transition' : 'initial';
				var o = state[k];
				$(state.$placeholder).css({
					width: sWidth,
					height: sHeight / 2
				}).animate({
					height: sHeights[index]
				}, o.duration, o.easing, function () {
					var $jq = state.behind[index]
						? $(state.$placeholder)
						: $(state.pinnedElement);
					$jq.on(eventName, function () {
						tool.switchTo(index);
					});
					++state.switchCount;
				});
			});
		}
	},
	
	Q: {
		beforeRemove: {"Q/drawers": function () {
			var state = this.state;
			var pinnedElement = state.pinnedElement;
			if (!pinnedElement) return;
			Q.Tool.clear(pinnedElement);
			Q.removeElement(pinnedElement);
		}}
	}
}

);

})(Q, jQuery);