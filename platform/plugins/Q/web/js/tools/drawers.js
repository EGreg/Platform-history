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
	state.swapCount = 0;
	
	if (state.fullscreen || !state.container) {
		state.container = $(tool.element).parents().eq(-3)[0];
	}

	state.$drawers = $(this.element).children();
	state.currentIndex = 1 - state.initial.index;
	this.swap();
	
	$(this.element).parents().each(function () {
		var $this = $(this);
		$this.data('Q/drawers originalBackground', $this.css('background'));
		$this.css('background', 'transparent');
		if ($this.is(state.container)) return false;
	});
	
	Q.onLayout.set(function () {
		// to do: fix for cases where element doesn't take up whole screen
	}, tool);
},

{
	initial: {
		duration: 300,
		ease: Q.Animation.linear,
		index: 1
	},
	transition: {
		duration: 300,
		easing: Q.Animation.linear
	},
	reversion: {
		duration: 300,
		easing: Q.Animation.linear
	},
	container: null,
	width: function () { return $(this.element).width() },
	height: function () {
		var result = $(window).height() - $(this.element).offset().top;
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
	scrollToBottom: [],
	fullscreen: Q.info.isMobile && Q.info.isAndroid(1000),
	foregroundZIndex: 50,
	scrollPause: 300
},

{	
	swap: function (callback) {
		var tool = this;
		var state = tool.state;
		var otherIndex = state.currentIndex;
		var index = state.currentIndex = (state.currentIndex + 1) % 2;
		var $drawer = state.$drawers.eq(index);
		var $otherDrawer = state.$drawers.eq(otherIndex);
		var sWidth = (typeof state.width === 'function')
			? state.width.call(tool, index) : state.width;
		var sHeights = (typeof state.heights === 'function')
			? state.heights.call(tool, index) : state.heights;
		var sHeight = (typeof state.height === 'function')
			? state.height.call(tool) : state.height;
		var $scrolling = state.fullscreen ? $(window) : $(state.container);
		var fromScroll = $scrolling.scrollTop();
		var behind = state.behind[index];
		var mHeight = sHeight - sHeights[index];
		var oHeight = mHeight - sHeights[otherIndex];
		var eventName = Q.info.isTouchscreen
			? 'touchstart.Q_drawers'
			: 'mousedown.Q_drawers';
		var scrollEventName = Q.info.isTouchscreen
			? 'touchend.Q_drawers'
			: 'scroll.Q_drawers';
		var scrollEventDebounce = Q.info.isTouchscreen
			? 0
			: state.scrollPause;
		
		if (state.locked) return false;
		state.locked = true;
		$scrolling.off(scrollEventName);
		$scrolling.scrollTop(0);
		$drawer.add($otherDrawer).add(state.$placeholder).off(eventName);
		
		if (behind) {
			_animate(_pin, _addEvents, callback);
		} else {
			_pin(_animate, _addEvents, callback);
		}
		
		function _pin(callback, callback2, callback3) {
			var p = state.drawerPosition;
			var w = state.drawerWidth;
			var h = state.drawerHeight;
			
			state.drawerPosition = $otherDrawer.css('position');
			state.drawerWidth = $otherDrawer.width();
			state.drawerHeight = $otherDrawer.height();
			state.drawerOffset = $otherDrawer.offset();
			$otherDrawer.css('position', 'relative');
			
			var $pe;
			if ($pe = state.$pinnedElement) {
				state.$placeholder.before($pe).remove();
				$pe.css({
					position: p,
					width: w,
					height: h,
					left: 0,
					top: 0
				});
			}
			
			state.$placeholder = $('<div class="Q_drawers_placeholder" />')
				.css({
					background: 'transparent',
					height: (behind ? sHeights[index] : mHeight) + 'px',
					cursor: 'pointer'
				}).insertAfter($otherDrawer);
			
			var jqAction = 'insert'+(state.behind[otherIndex]?'Before':'After');
			$otherDrawer[jqAction](state.container).css({
				position: state.fullscreen ? 'fixed' : 'absolute',
				width: sWidth,
				zIndex: $(state.container).css('zIndex')
			}).offset(state.drawerOffset);
			if (state.behind[index]) {
				$otherDrawer.css({cursor: 'pointer'});
			}
			if (state.fullscreen && state.behind[index]) {
				$otherDrawer.css({zIndex: state.foregroundZIndex});
			}
			state.$pinnedElement = $otherDrawer;
			
			// TODO: adjust height, do not rely on parent of container having
			// overflow: hidden
			
			callback(callback2, callback3);
		}
		
		function _animate(callback, callback2, callback3) {
			var o = state[state.switchCount ? 'transition' : 'initial'];
			var toScroll = index ? oHeight : 0;
			Q.Animation.play(function (x, y) {
				$scrolling.scrollTop(fromScroll + (toScroll-fromScroll) * y);
			}, o.duration, o.ease)
			.onComplete.set(function () {
				this.onComplete.remove("Q/drawers");
				setTimeout(function () {
					callback(callback2, callback3);
				}, 0);
			}, "Q/drawers");
		}
		
		function _addEvents(callback) {
			var o = state[state.switchCount ? 'transition' : 'initial'];
			var $jq = $(behind ? state.$pinnedElement : state.$placeholder);
			$jq.off(eventName).on(eventName, function () {
				tool.swap();
				return false;
			});
			if (!behind) {
				setTimeout(function () {
					$scrolling.on(scrollEventName,
						Q.debounce(_dragSwap, scrollEventDebounce)	
					);
				}, 100);
			}
			state.locked = false;
			++state.swapCount;
			Q.handle(callback, tool)
		}
		
		function _dragSwap() {
			var lastScrollTop = $scrolling.scrollTop();
			var interval = setInterval(function () {
				var st = $scrolling.scrollTop();
				if (st != lastScrollTop) {
					lastScrollTop = st;
					return; // wait until scrolling stops
				}
				clearInterval(interval);
				if (st < oHeight / 2) {
					tool.swap();
				} else if (st < oHeight) {
					state.locked = true;
					$scrolling.off(scrollEventName);
					var o = state.reversion;
					var scrollTop = $scrolling.scrollTop();
					Q.Animation.play(function (x, y) {
						$scrolling.scrollTop(scrollTop + (oHeight - scrollTop) * y);
					}, o.duration, o.ease)
					.onComplete.set(function () {
						state.locked = false;
						_addEvents();
						this.onComplete.remove("Q/drawers");
					}, "Q/drawers");
				}
			}, 100);
		}
	},
	
	Q: {
		beforeRemove: {"Q/drawers": function () {
			var state = this.state;
			$(this.element).parents().each(function () {
				var $this = $(this);
				var b = $this.data('Q/drawers originalBackground');
				if (b) {
					$this.css('background', b)
						.removeData('Q/drawers originalBackground');
				}
				if ($this.is(state.container)) return false;
			});
			var $pinnedElement = state.$pinnedElement;
			if (!$pinnedElement) return;
			Q.Tool.clear($pinnedElement[0]);
			Q.removeElement($pinnedElement[0]);
		}}
	}
}

);

})(Q, jQuery);