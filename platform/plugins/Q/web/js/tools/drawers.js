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
	var $te = $(tool.element);
	var $scrolling = state.$scrolling = 
		state.fullscreen ? $(window) : $(state.container);
	state.swapCount = 0;
	
	if (state.fullscreen || !state.container) {
		state.container = $(tool.element).parents().eq(-3)[0];
	}
	
	if ($te.css('position') == 'static') {
		$te.css('position', 'relative');
	}

	state.$drawers = $(this.element).children();
	state.currentIndex = 1 - state.initial.index;
	setTimeout(function () {
		tool.swap(_layout);
	}, state.initialDelay);
	
	$te.parents().each(function () {
		var $this = $(this);
		$this.data('Q/drawers originalBackground', $this.css('background'));
		$this.css('background', 'transparent');
		if ($this.is(state.container)) return false;
	});
	
	var columnIndex;
	if (Q.info.isMobile) {
		$te.parents().each(function () {
			var $this = $(this);
			if ($this.hasClass('Q_columns_column')) {
				columnIndex = $this.attr('data-index');
			}
			var columns = this.Q("Q/columns");
			if (columns) {
				columns.state.beforeOpen.set(function (options, index) {
					if (index !== columnIndex
					&& state.$pinnedElement
					&& state.behind[state.currentIndex]) {
						state.$pinnedElement.hide();
					}
				}, tool);
				columns.state.onClose.set(function () {
					var index = this.state.$currentColumn.attr('data-index');
					if (index === columnIndex
					&& state.$pinnedElement
					&& state.behind[state.currentIndex]) {
						state.$pinnedElement.show();
					}
				}, tool);
				return false;
			}
		});
	}
	
	var lastScrollingHeight = $scrolling[0].clientHeight || $scrolling.height();
	Q.onLayout.set(_layout, tool);
	function _layout() {
		// to do: fix for cases where element doesn't take up whole screen
		if (Q.info.isMobile) {
			var w = state.drawerWidth = $(window).width();
			$(tool.element).width(w);
			state.$drawers.width(w);
			state.$drawers.height();
		}
		var sh = $scrolling[0].clientHeight || $scrolling.height();
		var $d0 = state.$drawers.eq(0);
		var $d1 = state.$drawers.eq(1);
		$d0.css('min-height', sh-state.heights[1]+'px');
		$d1.css('min-height', sh-state.heights[0]+'px');
		if (state.currentIndex == 0) {
			var heightDiff = sh - lastScrollingHeight;
			var offset = $d1.offset();
			$d1.offset({
				left: offset.left,
				top: offset.top + heightDiff
			});
		}
		lastScrollingHeight = $scrolling[0].clientHeight || $scrolling.height();
	}
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
	initialDelay: 0,
	currentIndex: null,
	heights: [100, 100],
	behind: [true, false],
	scrollToBottom: [],
	fullscreen: Q.info.isMobile && Q.info.isAndroid(1000),
	foregroundZIndex: 50,
	beforeSwap: new Q.Event(),
	onSwap: new Q.Event()
},

{	
	swap: function (callback, animationStartCallback) {
		var tool = this;
		var state = tool.state;
		
		if (state.locked) return false;
		state.locked = true;
		
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
		var behind = state.behind[index];
		var fromHeight = behind 
			? sHeights[index] 
			: sHeight - sHeights[index];
		var toHeight = behind 
			? sHeight - sHeights[otherIndex] 
			: sHeights[otherIndex];
		var eventName = Q.info.isTouchscreen
			? 'touchstart.Q_drawers'
			: 'mousedown.Q_drawers';
		var scrollEventName = Q.info.isTouchscreen
			? 'scroll.Q_drawers'
			: 'scroll.Q_drawers';
		
		$scrolling.off(scrollEventName);
		$scrolling.scrollTop(0);
		
		$drawer.addClass('Q_drawers_current')
			.removeClass('Q_drawers_notCurrent');
		$otherDrawer.removeClass('Q_drawers_current')
			.addClass('Q_drawers_notCurrent');
			
		if ($(tool.element).css('position') == 'static') {
			$(tool.element).css('position', 'relative');
		}
		
		setTimeout(function () {
			$drawer.add($otherDrawer).add(state.$placeholder).off(eventName);
		
			function _onSwap() {
				state.onSwap.handle.call(tool, state.currentIndex);
				Q.handle(callback, tool);
			};
		
			state.beforeSwap.handle.call(tool, index);
			if (behind) {
				_animate([_pin, _addEvents, _onSwap]);
			} else {
				_pin([_animate, _addEvents, _onSwap]);
			}
		}, 0);
		
		function _pin(callbacks) {
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
					left: 0,
					top: 0
				});
			}
			
			state.$placeholder = $('<div class="Q_drawers_placeholder" />')
				.css({
					background: 'transparent',
					height: fromHeight + 'px',
					cursor: 'pointer'
				}).insertAfter($otherDrawer);
			
			var jqAction = 'insert'+(state.behind[otherIndex]?'Before':'After');
			$otherDrawer[jqAction](state.container).css({
				position: state.fullscreen ? 'fixed' : 'absolute',
				width: sWidth,
				zIndex: $(state.container).css('zIndex')
			}).offset(state.drawerOffset)
			.activate(); // otherwise Q.find might not have found this element!
			if (state.behind[index]) {
				$otherDrawer.css({cursor: 'pointer'});
			}
			if (state.fullscreen && state.behind[index]) {
				$otherDrawer.css({zIndex: state.foregroundZIndex});
			}
			state.$pinnedElement = $otherDrawer;
			
			// TODO: adjust height, do not rely on parent of container having
			// overflow: hidden
			
			callbacks[0](callbacks.slice(1));
		}
		
		function _animate(callbacks) {
			Q.handle(animationStartCallback);
			var o = state[state.swapCount ? 'transition' : 'initial'];
			if (!state.$placeholder) {
				return _continue();
			}
			Q.Animation.play(function (x, y) {
				state.$placeholder.height(fromHeight + (toHeight-fromHeight)*y);
			}, o.duration, o.ease)
			.onComplete.set(function () {
				this.onComplete.remove("Q/drawers");
				_continue();
			}, "Q/drawers");
			function _continue() {
				setTimeout(function () {
					callbacks[0](callbacks.slice(1));
				}, 0);
			}
		}
		
		function _addEvents(callbacks) {
			var o = state[state.swapCount ? 'transition' : 'initial'];
			var $jq = $(behind ? state.$pinnedElement : state.$placeholder);
			$jq.off(eventName).on(eventName, function () {
				tool.swap();
				return false;
			});
			if (!behind) {
				if (Q.info.isTouchscreen) {
					$scrolling.off('touchstart.Q_columns')
						.off('touchend.Q_columns')
						.on('touchstart.Q_columns', function (event) {
							state.touchCount = Q.Pointer.touchCount(event);
						}).on('touchend.Q_columns', function (event) {
							state.touchCount = 0;
						});
				}
			}
			state.locked = false;
			++state.swapCount;
			
			if (Q.info.isTouchscreen && !Q.info.isAndroid()) {
				_addTouchEvents();
			}
			
			Q.handle(callbacks[0], tool);
		}
		
		function _addTouchEvents() {
			var y1, y2;
			var anim = null;
			var notThisOne = false;
			state.$drawers.eq(state.currentIndex)
			.on('touchstart', true, function (e) {
				if (anim) anim.pause();
				notThisOne = false;
				if (state.currentIndex == 0
				|| state.$scrolling.scrollTop() > 0) {
					notThisOne = true;
					return;
				}
				y1 = Q.Pointer.getY(e);
				e.preventDefault();
			}).on('touchmove', true, function (e) {
				if (notThisOne) return;
				y2 = Q.Pointer.getY(e);
				if (y1 - y2 > 0) {
					state.$scrolling.scrollTop(y1-y2);	
					state.$drawers.eq(1).css('margin-top', 0);
				} else {
					state.$drawers.eq(1).css('margin-top', y2-y1);
				}
			}).on('touchend', true, function (e) {
				if (notThisOne) return;
				if (y2 - y1 > 20) {
					tool.swap(null, function () {
						var $d = state.$drawers.eq(1);
						var mt = parseInt($d.css('margin-top'));
						Q.Animation.play(function (x, y) {
							$d.css('margin-top', mt*(1-y)+'px');
						}, state.transition.duration);
					});
				} else {
					anim = Q.Animation.play(function (x, y) {
						if (!Q.Pointer.movement.movingAverageVelocity) return;
						var v = Q.Pointer.movement.movingAverageVelocity.y;
						var t = state.$scrolling.scrollTop();
						var dampening = 1-y;
						state.$scrolling.scrollTop(t-v*this.sinceLastFrame*dampening);
					}, 3000, Q.Animation.ease.power(3));
				}
				y1 = y2 = undefined;
			});
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
			var $scrolling = state.fullscreen ? $(window) : $(state.container);
			$scrolling.off(state.scrollEventName)
				.off('touchstart.Q_drawers')
				.off('touchend.Q_drawers');
		}}
	}
}

);

})(Q, jQuery);