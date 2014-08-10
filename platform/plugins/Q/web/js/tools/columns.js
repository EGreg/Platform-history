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
		if (state.$curr) {
			state.$curr.data(dataKey_scrollTop, Q.Pointer.scrollTop());
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
	onOpen: new Q.Event(function () { }, 'Q/columns'),
	beforeClose: new Q.Event(function () { }, 'Q/columns')
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
			state.$curr = $(div)
				.append($title, columnSlot)
				.data(dataKey_index, index)
				.data(dataKey_scrollTop, Q.Pointer.scrollTop())
				.appendTo(state.container);
			if (state.fullscreen) {
				$(window).scrollTop(0);
			}
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
				
				if (!Q.info.isMobile) {
					$sc.width(tool.$('.Q_columns_column').length * tool.$('.Q_columns_column').outerWidth(true));

					$(tool.element).animate({
						scrollLeft: tool.$('.Q_columns_container').width()
					}, duration);
				}
				
				$div.css('display', 'block').css(state.animation.css.hide);
				$div.show().animate(state.animation.css.show, duration, function(){
					var heightToBottom = $(window).height()
						-$cs.offset().top
						-parseInt($cs.css('padding-top'));
					var $cc = $('.Q_columns_column', $div);
					if (Q.info.isMobile) {
						if (state.fullscreen) {
							$cs.add($div).add($cc).height('auto');
						} else {
							$cs.height(heightToBottom);
						}
						$cs.css('min-height', heightToBottom);
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

				if (Q.info.isTouchscreen) {
					if (state.fullscreen) {
						$cs.css({
							'overflow': 'visible', 
							'height': 'auto'
						});
					} else {
						$cs.css('overflow', 'auto');
					}
				} else if (state.scrollbarsAutoHide) {
					$cs.plugin('Q/scrollbarsAutoHide', options.scrollbarsAutoHide);
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
		this.$current = $prev;
		$div.animate(state.animation.css.hide, duration, function () {
			Q.removeElement(tool.column(index));
			state.columns[index] = null;
		
			if (index === state.max-1) {
				--state.max;
			}
			var $sc = $(state.container);
			$sc.width($sc.width() - w);
		});
	},

	column: function (index) {
		return this.state.columns[index] || null;
	},
	
	refresh: function () {
		var tool = this;
		var state = tool.state;
		var $te = $(tool.element);
		
		if (Q.info.isMobile) {
			var w = $(window).width();
			$te.add('.Q_columns_column, .Q_columns_container', $te).width(w);
			if (!state.fullscreen) {
				$te.css('overflow', 'hidden');
				// TODO: iscroll
			}
		}

		if (state.fullscreen) {
			$te.addClass('Q_fullscreen');
		}
	}
}
);

Q.Template.set('Q/columns/column',
	'<div class="Q_contextual"><ul class="Q_listing"></ul></div>'
);

var dataKey_index = 'index';
var dataKey_scrollTop = 'scrollTop';

})(Q, jQuery);