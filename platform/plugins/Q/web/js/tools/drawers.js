(function (Q, $) {
/**
 * @module Q-tools
 */
	
/**
 * Implements vertical drawers that work on most modern browsers,
 * including ones on touchscreens.
 * @class Q drawers
 * @constructor
 * @param {Object}   [options] Override various options for this tool
 * @return {Q.Tool}
 */
Q.Tool.define("Q/drawers", function _Q_drawers(options) {
	var tool = this;
	var state = tool.state;
	var $te = $(tool.element);
	var $scrolling = state.$scrolling = 
		state.fullscreen ? $(window) : $(state.container);
	state.swapCount = 0;
	
	Q.addStylesheet('plugins/Q/css/drawers.css');
	
	if (state.fullscreen || !state.container) {
		state.container = $(tool.element).parents().eq(-3)[0];
	}
	
	if ($te.css('position') == 'static') {
		$te.css('position', 'relative');
	}

	if (!state.behind[0]) {
		state.bottom[0] = true;
	}
	if (!state.behind[1]) {
		state.bottom[1] = false;
	}

	state.$drawers = $(this.element).children();
	state.currentIndex = 1 - state.initial.index;
	state.canceledSwap = null;
	var lastScrollingHeight;
	setTimeout(function () {
		state.lastScrollingHeight = $scrolling[0].clientHeight || $scrolling.height();
		tool.swap(_layout);
		Q.onLayout(tool).set(_layout, tool);
	}, state.initialDelay);
	
	$te.parents().each(function () {
		var $this = $(this);
		$this.data('Q/drawers originalBackground', $this.css('background'));
		$this.css('background', 'transparent');
		if ($this.is(state.container)) return false;
	});
	
	if (Q.info.isMobile) {
		this.managePinned();
	}
	
	// Accomodate mobile keyboard
	if (Q.info.isMobile) {
		state.$drawers.eq(0).on(Q.Pointer.focusin, tool, function () {
			state.$drawers.eq(1).hide();
		});
		state.$drawers.eq(0).on(Q.Pointer.focusout, tool, function () {
			state.$drawers.eq(1).show();
		});
	}

	function _layout() {
		// to do: fix for cases where element doesn't take up whole screen
		if (Q.info.isMobile) {
			var w = state.drawerWidth = $(window).width();
			$(tool.element).width(w);
			state.$drawers.width(w);
			state.$drawers.height();
		}
		var sh = $scrolling[0].clientHeight || $scrolling.height();
		var sHeights = (state.heights instanceof Array)
			? state.heights : Q.getObject(state.heights).apply(tool);
		var $d0 = state.$drawers.eq(0);
		var $d1 = state.$drawers.eq(1);
		$d0.css('min-height', sh-sHeights[1]+'px');
		$d1.css('min-height', sh-sHeights[0]+'px');
		if (state.currentIndex == 0) {
			var heightDiff = sh - lastScrollingHeight;
			var offset = $d1.offset();
			$d1.offset({
				left: offset.left,
				top: offset.top + heightDiff
			});
		}
		state.lastScrollingHeight = $scrolling[0].clientHeight || $scrolling.height();
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
		var result = Q.Pointer.windowHeight() - $(this.element).offset().top;
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
	placeholders: ['', ''],
	heights: [100, 100],
	behind: [true, false],
	bottom: [false, false],
	triggers: ['plugins/Q/img/drawers/up.png', 'plugins/Q/img/drawers/down.png'],
	trigger: { rightMargin: 10, transition: 300 },
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
		var sWidth = (typeof state.width === 'number')
			? state.width : Q.getObject(state.width).apply(tool);
		var sHeight = (typeof state.height === 'number')
			? state.height : Q.getObject(state.height).apply(tool);
		var sHeights = (state.heights instanceof Array)
			? state.heights : Q.getObject(state.heights).apply(tool);
		var $scrolling = state.fullscreen ? $(window) : $(state.container);
		var behind = state.behind[index];
		var fromHeight = behind 
			? sHeights[index] 
			: sHeight - sHeights[index];
		var toHeight = behind 
			? sHeight - sHeights[otherIndex] 
			: sHeights[otherIndex];
		var eventName = Q.info.isTouchscreen
			? 'touchend.Q_drawers'
			: 'mouseup.Q_drawers';
		var scrollEventName = 'scroll.Q_drawers';
		var scrollingHeight;
		
		// give things a chance to settle down
		setTimeout(_setup1, 0);
		
		function _setup1() {
			var scrollTop;
			var sHeights = (state.heights instanceof Array)
				? state.heights : Q.getObject(state.heights).apply(tool);
			state.lastScrollingHeight = scrollingHeight =  $scrolling[0].clientHeight || $scrolling.height();
			scrollTop = state.bottom[otherIndex]
				? -scrollingHeight + sHeights + $otherDrawer.height()
				: 0;
			$scrolling.scrollTop(scrollTop);
		
			$scrolling.off(scrollEventName);
		
			$drawer.addClass('Q_drawers_current')
				.removeClass('Q_drawers_notCurrent');
			$otherDrawer.removeClass('Q_drawers_current')
				.addClass('Q_drawers_notCurrent');
			
			if ($(tool.element).css('position') == 'static') {
				$(tool.element).css('position', 'relative');
			}
			
			// give that scrollTop a chance to take effect
			setTimeout(_setup2, 0);
		}
		
		function _setup2() {
			$drawer.add($otherDrawer).add(state.$placeholder).off(eventName);

			function _onSwap() {
				state.onSwap.handle.call(tool, state.currentIndex);
				Q.handle(callback, tool);
			};

			state.beforeSwap.handle.call(tool, index);
			
			if (state.$trigger) {
				state.$trigger.remove();
			}
			if (behind) {
				_animate([_pin, _addEvents, _onSwap]);
			} else {
				_pin([_animate, _addEvents, _onSwap]);
			}
		}
		
		function _pin(callbacks) {
			var ae = document.activeElement;
			$otherDrawer.css('position', 'relative');
			var p = state.drawerPosition;
			var w = state.drawerWidth;
			var h = state.drawerHeight;
		
			state.drawerPosition = $otherDrawer.css('position');
			state.drawerWidth = $otherDrawer.width();
			state.drawerHeight = $otherDrawer.height();
			state.drawerOffset = $otherDrawer.offset();
			
			var $pe;
			if ($pe = state.$pinnedElement) {
				state.$placeholder.before($pe).remove();
				$pe.css({
					position: p,
					left: 0,
					top: 0
				});
			} else if (!index) {
				var sHeights = (state.heights instanceof Array)
					? state.heights : Q.getObject(state.heights).apply(tool);
				state.drawerOffset = $scrolling.offset()
					|| {left: 0, top: 0};
				state.drawerOffset.top += state.bottom[1]
					? 0
					: scrollingHeight - sHeights[1];
			}
			
			$scrolling.scrollTop(
				state.bottom[index] ? $scrolling[0].scrollHeight : 0
			);
			if ($pe && index) {
				state.drawerOffset = $otherDrawer.offset();
			}
			
			var sHeights = (state.heights instanceof Array)
				? state.heights : Q.getObject(state.heights).apply(tool);
			state.$placeholder = $('<div class="Q_drawers_placeholder" />')
				.html(state.placeholders[otherIndex])
				.css({
					background: 'transparent',
					height: (index ? fromHeight : sHeights[1]) + 'px',
					cursor: 'pointer'
				}).insertAfter($otherDrawer);
			state.$placeholder.find('*').css('pointer-events', 'none');
			
			var jqAction = 'insert'+(state.behind[otherIndex]?'Before':'After');
			$otherDrawer[jqAction](state.container).css({
				position: state.fullscreen ? 'fixed' : 'absolute',
				width: sWidth,
				zIndex: $(state.container).css('zIndex')
			}).offset(state.drawerOffset)
			.activate(); // Q.find missed it outside the tool's element
			if (state.behind[index]) {
				$otherDrawer.css({cursor: 'pointer'});
			}
			if (state.fullscreen && state.behind[index]) {
				$otherDrawer.css({zIndex: state.foregroundZIndex});
			}
			state.$pinnedElement = $otherDrawer;
			if (Q.info.isMobile) {
				tool.managePinned();
			}
			
			// TODO: adjust height, do not rely on parent of container having
			// overflow: hidden
			
			if (!$(ae).closest(state.$otherDrawer).length) {
				ae.focus();
			}
			callbacks[0](callbacks.slice(1));
		}
		
		function _animate(callbacks) {
			Q.handle(animationStartCallback);
			var o = state[state.swapCount ? 'transition' : 'initial'];
			if (!state.$placeholder) {
				return _continue();
			}
			if (!o.duration) {
				state.$placeholder.height(toHeight);
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
			$jq.off(eventName).on(eventName, function (evt) {
				var product = Q.Pointer.movement && Q.Pointer.movement.movingAverageVelocity
					? Q.Pointer.movement.movingAverageVelocity.y * (state.currentIndex-0.5)
					: 0;
				if (!$(evt.target).closest('.Q_discourageDrawerSwap').length
				&& product >= 0) {
					if (Q.Pointer.which(evt) < 2) {
						// don't do it right away, so that other event handlers
						// can still access the old state.currentIndex
						setTimeout(function () {
							if (!state.canceledSwap) {
								tool.swap();
							}
							state.canceledSwap = null;
						}, 0);
					}
				}
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
			
			var src = state.triggers[state.currentIndex];
			if (state.$trigger) {
				state.$trigger.remove();
			}
			if (src) {
				state.$trigger = $('<img />').attr({
					'src': Q.url(src),
					'class': 'Q_drawers_trigger',
					'alt': state.currentIndex ? 'reveal bottom drawer' : 'reveal top drawer'
				}).insertAfter(state.$drawers[1])
				.css({'opacity': 0})
				.animate({'opacity': 1}, state.trigger.transition)
				.on(Q.Pointer.start, function (evt) {
					if (Q.Pointer.which(evt) < 2) {
						state.$trigger.hide();
						tool.swap();
					}
				});
				var $drawer = tool.state.$drawers.eq(1);
				if ($drawer.is(':visible')) {
					var left = $drawer.offset().left
						- $drawer.offsetParent().offset().left
						+ $drawer.outerWidth(true)
						- state.$trigger.outerWidth(true)
						- state.trigger.rightMargin;
					var top = $drawer.offset().top
						- $drawer.offsetParent().offset().top
						- state.$trigger.height() / 2;
					state.$trigger.css({
						left: left + 'px',
						top: top + 'px',
						position: state.fullscreen ? 'fixed' : 'absolute'
					});
				} else {
					state.$trigger.hide();
				}
			}
			
			Q.handle(callbacks[0], tool);
		}
		
		function _addTouchEvents() {
			var y1, y2;
			var anim = null;
			var notThisOne = false;
			var canShowTrigger = true;
			state.$placeholder.on('touchmove', function (e) {
				e.preventDefault();
			});
			state.$drawers.eq(state.currentIndex)
			.on('touchstart', true, function (e) {
				if (anim) anim.pause();
				notThisOne = false;
				if (state.currentIndex == 0
				|| state.$scrolling.scrollTop() > 0
				|| $(e.target).closest('.Q_discourageDrawerSwap').length) {
					notThisOne = true;
					return;
				}
				state.$trigger.hide();
				canShowTrigger = false;
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
				canShowTrigger = false;
			}).on('touchend', true, function (e) {
				if (notThisOne) return;
				if (y2 - y1 > 0) {
					tool.swap(null, function () {
						var $d = state.$drawers.eq(1);
						var mt = parseInt($d.css('margin-top'));
						Q.Animation.play(function (x, y) {
							$d.css('margin-top', mt*(1-y)+'px');
						}, state.transition.duration);
					});
				} else {
					anim = Q.Animation.play(function (x, y) {
						if (!Q.Pointer.movement
						|| !Q.Pointer.movement.movingAverageVelocity) {
							return;
						}
						var v = Q.Pointer.movement.movingAverageVelocity.y;
						var t = state.$scrolling.scrollTop();
						var dampening = 1-y;
						state.$scrolling.scrollTop(
							t-v*this.sinceLastFrame*dampening
						);
					}, 3000, Q.Animation.ease.power(3.5));
				}
				y1 = y2 = undefined;
				canShowTrigger = true;
			});
			state.$interval = setInterval(function () {
				if (!state.$drawers.eq(1).is(':visible')) {
					state.$trigger.hide();
				} else if (canShowTrigger && state.$scrolling.scrollTop() === 0) {
					var $drawer = tool.state.$drawers.eq(1);
					var left = $drawer.offset().left
						- $drawer.offsetParent().offset().left
						+ $drawer.outerWidth(true)
						- state.$trigger.outerWidth(true)
						- state.trigger.rightMargin;
					var top = $drawer.offset().top
						- $drawer.offsetParent().offset().top
						- state.$trigger.height() / 2;
					state.$trigger.show().css({
						left: left + 'px',
						top: top + 'px'
					});
				}
			}, 300);
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
			if (state.$trigger) {
				state.$trigger.remove();
			}
			clearInterval(state.$interval);
		}}
	},
	managePinned: function () {
		var columnIndex;
		var tool = this;
		var state = tool.state;
		$(this.element).parents().each(function () {
			var $this = $(this);
			if ($this.hasClass('Q_columns_column')) {
				columnIndex = $this.attr('data-index');
			}
			var columns = this.Q("Q/columns");
			if (columns) {
				if (columns.state.currentIndex != columnIndex
				&& state.$pinnedElement
				&& state.behind[state.currentIndex]) {
					state.$pinnedElement
					.add(state.$trigger).hide();
				}
				columns.state.beforeOpen.set(function (options, index) {
					if (index !== columnIndex
					&& state.$pinnedElement
					&& state.behind[state.currentIndex]) {
						state.$pinnedElement
						.add(state.$trigger).hide();
					}
				}, tool);
				columns.state.onClose.set(function () {
					var index = this.state.$currentColumn.attr('data-index');
					if (index === columnIndex
					&& state.$pinnedElement
					&& state.behind[state.currentIndex]) {
						state.$pinnedElement
						.add(state.$trigger).show();
					}
				}, tool);
				return false;
			}
		});
	}
}

);

})(Q, jQuery);