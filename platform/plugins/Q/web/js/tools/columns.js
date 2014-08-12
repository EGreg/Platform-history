(function (Q, $) {
/**
 * @module Q-tools
 */
	
/**
 * This tool contains functionality to show things in columns
 * @class Q columns
 * @constructor
 * @param {Object}   [options] This object contains properties for this function
 *  @param {Object}  [options.animation] For customizing animated transitions
 *  @param {Number}  [options.animation.duration] The duration of the transition in milliseconds, defaults to 500
 *  @param {Object}  [options.animation.hide] The css properties in "hide" state of animation
 *  @param {Object}  [options.animation.show] The css properties in "show" state of animation
 *  @param {Object}  [options.back] For customizing the back button on mobile
 *  @param {String}  [options.back.src] The src of the image to use for the back button
 *  @param {Boolean} [options.back.triggerFromTitle] Whether the whole title would be a trigger for the back button. Defaults to true.
 *  @param {Boolean} [options.back.hide] Whether to hide the back button. Defaults to false, but you can pass true on android, for example.
 *  @param {Object}  [options.close] For customizing the back button on desktop and tablet
 *  @param {String}  [options.close.src] The src of the image to use for the close button
 *  @param {Object}  [options.close.clickable] If not null, enables the Q/clickable tool with options from here. Defaults to null.
 *  @param {Object}  [options.scrollbarsAutoHide] If not null, enables Q/scrollbarsAutoHide functionality with options from here. Enabled by default.
 *  @param {Boolean} [options.fullscreen] Whether to use fullscreen mode on mobile phones, using document to scroll instead of relying on possibly buggy "overflow" CSS implementation. Defaults to true on Android, false everywhere else.
 *  @param {Q.Event} [options.onOpen] Event that happens after a column is opened.
 *  @param {Q.Event} [options.beforeClose] Event that happens before a column is closed. Return false to prevent closing.
 * @return Q.Tool
 */
Q.Tool.define("Q/columns", function(options) {
	var tool = this;
	var state = tool.state;

	state.container = document.createElement('div')
		.addClass('Q_columns_container Q_clearfix');
	tool.element.appendChild(this.state.container);

	state.max = 0;
	state.columns = {};
	state.triggers = {};

	var selector = '.Q_close';
	if (Q.info.isMobile && state.back.triggerFromTitle) {
		selector = '.Q_columns_title';
	}
	$(tool.element).on(Q.Pointer.click, selector, function(){
		var index = $(this).closest('.Q_columns_column').data(dataKey_index);
		if (index) {
			tool.close(index);
		}
	}); // no need for key, it will be removed when tool element is removed
	
	Q.onScroll.set(Q.debounce(function () {
		if (state.$currentColumn) {
			state.$currentColumn.data(dataKey_scrollTop, Q.Pointer.scrollTop());
		}
	}, 100));
	
	tool.refresh();
	Q.onLayout.set(function () {
		tool.refresh();
	}, tool);
},

{
	animation: { 
		duration: 500, // milliseconds
		css: {
			hide: {
				opacity: 0, 
				top: '50%',
				height: 0
			},
			show: {
				opacity: 1, 
				top: 0,
				height: '100%',
			}
		},
	},
	back: {
		src: "plugins/Q/img/back-v.png",
		triggerFromTitle: true,
		hide: false
	},
	close: {
		src: "plugins/Q/img/x.png",
		clickable: null
	},
	scrollbarsAutoHide: {},
	fullscreen: Q.info.isAndroid(1000),
	beforeOpen: new Q.Event(),
	beforeClose: new Q.Event(),
	onOpen: new Q.Event(),
	onClose: new Q.Event()
},

{
	max: function () {
		return this.state.max;
	},
	
	push: function (options) {
		this.open(options, this.max());
	},
	
	pop: function () {
		this.close(this.max()-1);
	},
	
	open: function (options, index) {
		var tool = this;
		var state = this.state;

		if (index > this.max()) {
			throw new Q.Exception("Q/columns open: index is too big");
		}
		if (index < 0) {
			throw new Q.Exception("Q/columns open: index is negative");
		}
		
		if (false === state.beforeOpen.handle.call(tool, options, index)
		 || false === Q.handle(options.beforeOpen, tool, [options, index])) {
			return false;
		}
		
		var div = this.column(index);
		var titleSlot, columnSlot;
		if (!div) {
			div = document.createElement('div').addClass('Q_columns_column');
			++this.state.max;
			this.state.columns[index] = div;
			var $ts = $('<h2 class="title_slot"></h2>');
			titleSlot = $ts[0];
			var $close = !index ? $() : $('<div class="Q_close"></div>');
			var $title = $('<div class="Q_columns_title"></div>')
				.append($ts);
			if (index) {
				$title.prepend ($close);
			}
			if (Q.info.isMobile) {
				$close.addClass('Q_back').append(
					$('<img alt="Back" />').attr('src', Q.url(state.back.src))
				);
				if (state.back.hide) {
					$close.hide();
				}
			} else {
				$close.append(
					$('<img alt="Close" />').attr('src', Q.url(state.close.src))
				);
			}
			columnSlot = document.createElement('div').addClass('column_slot');
			state.$currentColumn = $(div)
				.append($title, columnSlot)
				.data(dataKey_index, index)
				.data(dataKey_scrollTop, Q.Pointer.scrollTop())
				.appendTo(state.container);
			if (state.fullscreen) {
				$(window).scrollTop(0);
			}
			presentColumn(tool);
		}

		$(div).css(state.animation.css.hide);

		if (options.url) {
			var url = options.url;
			var o = Q.extend({
				slotNames: ["title", "column"], 
				slotContainer: {
					title: titleSlot,
					column: columnSlot
				},
				quiet: true,
				ignoreHistory: true,
				ignorePage: true
			}, options);
			o.handler = function _handler(response) {
				var elementsToActivate = [];
				if ('title' in response.slots) {
					$(titleSlot).html(response.slots.title);
					elementsToActivate['title'] = titleSlot;
				}
				columnSlot.innerHTML = response.slots.column;
				elementsToActivate['column'] = columnSlot;
				return elementsToActivate;
			};
			o.onActivate = _onOpen;
			// this.state.triggers[index] = options.trigger || null;
			Q.loadUrl(url, o);
		} else {
			if ('title' in options) {
				titleSlot.innerHTML = options.title;
			}
			if ('column' in options) {
				columnSlot.innerHTML = options.column;
			}
			_onOpen();
		}
		function _onOpen() {
			var $div = $(div);

			if (Q.info.isMobile) {
				var $sc = $(state.container);
				var h = $(window).height() - $sc.offset().top;
				state.animation.css.show.width = $(tool.element).width();
				state.animation.css.show.height = h;
				$sc.height(h);
				$div.css('position', 'absolute');
			}
			
			openAnimation();

			function openAnimation(){
				// open animation
				var duration = state.animation.duration;
				var $sc = $(state.container);
				var $cs = $('.column_slot', $div);
				var $ct = $('.Q_columns_title', $div);
				
				if (!Q.info.isMobile) {
					$sc.width(tool.$('.Q_columns_column').length * tool.$('.Q_columns_column').outerWidth(true));

					$(tool.element).animate({
						scrollLeft: tool.$('.Q_columns_container').width()
					}, duration);
				}
				
				$div.css('display', 'block').css(state.animation.css.hide);
				if (state.fullscreen) {
					$ct.css('position', 'absolute');
				}
				$div.show().animate(state.animation.css.show, duration, function(){
					if (state.fullscreen) {
						$ct.css('position', 'fixed');
					}
					var heightToBottom = $(window).height()
						- $cs.offset().top
						- parseInt($cs.css('padding-top'));
					if (Q.info.isMobile) {
						if (state.fullscreen) {
							$cs.add($div).css('height', 'auto');
							$cs.css('min-height', heightToBottom);
						} else {
							$cs.height(heightToBottom);
							$div.css('height', 'auto');
						}
						$div.prev().hide();
					} else {
						if (state.close.clickable) {
							$close.plugin("Q/clickable", state.close.clickable);
						}
					}
					afterAnimate();
				});
			}

			function afterAnimate(){
				var $cs = $(columnSlot);
				presentColumn(tool);

				if (!Q.info.isMobile) {
					var heightToBottom = $(tool.element).height()
						- $cs.offset().top + $cs.parent().offset().top
						- parseInt($cs.css('padding-top'));
					$cs.height(heightToBottom);
				}

				if (Q.info.isTouchscreen) {
					if (state.fullscreen) {
						$cs.css({
							'overflow': 'visible', 
							'height': 'auto'
						});
					} else {
						$cs.addClass('Q_overflow');
						if (Q.info.isTouchscreen && !window.overthrow) {
							Q.ensure(
								window.overthrow, 
								"plugins/Q/js/overthrow.js",
								function () {
									overthrow.scrollIndicatorClassName = 'Q_overflow';
									overthrow.set();
								}
							)
							Q.addScript();
						}
					}
				} else {
					if (state.scrollbarsAutoHide) {
						$cs.plugin('Q/scrollbarsAutoHide', state.scrollbarsAutoHide);
					} else {
						$cs.css('overflow', 'auto');
					}
				}

				state.onOpen.handle.call(tool, options, index);
				Q.handle(options.onOpen, tool, [options, index]);
			}
		}
	},

	close: function (index) {
		var tool = this;
		var state = tool.state;
		var div = tool.column(index);
		if (!div) {
			throw new Q.Exception("Column with index " + index + " doesn't exist");
		}
		var $div = $(div);
		var width = $div.outerWidth(true);
		var shouldContinue = state.beforeClose.handle.call(tool, index);
		if (shouldContinue === false) return;
		
		var w = $div.outerWidth(true);
		var duration = state.animation.duration;
		var $prev = $div.prev();
		$prev.show();
		if (state.fullscreen) {
			$(window).scrollTop($prev.data(dataKey_scrollTop) || 0);
		}
		state.$currentColumn = $prev;
		if (state.fullscreen) {
			// make the title move while animating, until it is removed
			$('.Q_columns_title', $div).css('position', 'absolute');
		}
		presentColumn(tool);
		$div.animate(state.animation.css.hide, duration, function () {
			Q.removeElement(div); // remove it correctly
			state.columns[index] = null;
		
			if (index === state.max-1) {
				--state.max;
			}
			var $sc = $(state.container);
			$sc.width($sc.width() - w);
			presentColumn(tool);
			state.onClose.handle.call(tool, index, div);
		});
	},

	column: function (index) {
		return this.state.columns[index] || null;
	},
	
	refresh: function () {
		var tool = this;
		var state = tool.state;
		var $te = $(tool.element);
		var $columns = $('.Q_columns_column', $te);
		var $container = $('.Q_columns_container', $te);
		var $cs = $('.Q_columns_column .column_slot', $te);
		
		if (Q.info.isMobile) {
			$te.add($container).add($columns).width($(window).width());
			if (!state.fullscreen) {
				$te.css('overflow', 'visible')
					.add($container)
					.add($columns)
					.height($(window).height()-$te.offset().top);
			}
			presentColumn(tool);
		}

		if (state.fullscreen) {
			$te.addClass('Q_fullscreen');
		}
		
		var overshoot = Q.Pointer.scrollTop() + $(document).height() - $(window).height();
		if (overshoot > 0) {
			$(window).scrollTop( $(window).scrollTop()-overshoot );
		}
	}
}
);

Q.Template.set('Q/columns/column',
	'<div class="Q_contextual"><ul class="Q_listing"></ul></div>'
);

function presentColumn(tool) {
	if (!tool.state.$currentColumn) return;
	$cs = $('.column_slot', tool.state.$currentColumn);
	if (tool.state.fullscreen) {
		$cs.css('padding-top', $cs.prev().outerHeight()+'px');
	}
	if (Q.info.isMobile) {
		var heightToBottom = $(tool.element).height()
			- $cs.offset().top
			- parseInt($cs.css('padding-top'));
		if (!tool.state.fullscreen) {
			$cs.height(heightToBottom);
			// TODO: iscroll
		} else {
			$cs.css('min-height', heightToBottom);
		}
	}
}

var dataKey_index = 'index';
var dataKey_scrollTop = 'scrollTop';

})(Q, jQuery);