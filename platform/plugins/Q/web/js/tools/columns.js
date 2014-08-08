(function (Q, $) {
/**
 * @module Q-tools
 */
	
/**
 * This tool contains functionality to show things in columns
 * @class Q columns
 * @constructor
 * @param {Object} [options] This object contains properties for this function
 *  @param {Array} [options.columns] An associative array of name: title pairs.

 * @return Q.Tool
 */
Q.Tool.define("Q/columns", function(options) {
	var tool = this;

	this.state.container = document.createElement('div').addClass('Q_columns_container');
	this.element.appendChild(this.state.container);
	
	tool.state.max = 0;
	this.state.columns = {};
	this.state.triggers = {};

	this.$('.close').live('click', function(){
		var index = $(this).parents('.Q_columns_column').data('index');
		if (index !== undefined) {
			tool.close(index);
		}
	});

	this.$('.back').live('click', function(){
		var $current = $(this).parents('.Q_columns_column'),
			$trigger = $current.prev('.Q_columns_column'),
			duration = tool.state.animation.duration;

		if ($trigger.get(0)) {
			$current.animate(tool.state.animation.css.hide, duration, function(){
				$current.hide();
				$trigger.show().animate(tool.state.animation.css.show, duration);
			});
		}
	});

	if (Q.info.isMobile) {
		$(this.element).css('overflow', 'hidden');
	}

	if (Q.info.isMobile && tool.state.fullscreenMobile) {
		$(tool.element).addClass('Q_fullscreen');
	}
},

{
	onOpen: new Q.Event(function () { }, 'Q/columns'),
	beforeClose: new Q.Event(function () { }, 'Q/columns'),
	animation: { 
		duration: 500, // milliseconds
		css: {
			hide: {
				opacity: 0, 
				height: 0
			},
			show: {
				opacity: 1, 
				height: '100%',
				display: 'block'
			}
		},
	},
	tagName: 'div',
	fullscreenMobile: true,
	scrollbarsAutoHide: {}
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
		var title, column;
		if (!div) {
			div = document.createElement(this.state.tagName).addClass('Q_columns_column');
			++this.state.max;
			this.state.columns[index] = div;
			title = createTitle();
			titleText = $(title).children('.title_slot').get(0);
			column = document.createElement('div').addClass('column_slot');
			div.appendChild(title);
			div.appendChild(column);
			this.state.container.appendChild(div);
		}

		$(div).data('index', index).css(tool.state.animation.css.hide);

		if (options.url) {
			var url = options.url;
			var o = Q.extend({
				slotNames: ["title", "column"], 
				slotContainer: {
					title: titleText,
					column: column
				},
				quiet: true,
				ignoreHistory: true
			}, options);
			o.handler = function _handler(response) {
				var elementsToActivate = [];
				if ('title' in response.slots) {
					$(titleText).text(response.slots.title);
					elementsToActivate['title'] = title;
				}
				column.innerHTML = response.slots.column;
				elementsToActivate['column'] = column;
				return elementsToActivate;
			};
			o.onActivate = _onOpen;
			// this.state.triggers[index] = options.trigger || null;
			Q.loadUrl(url, o);
		} else {
			if ('title' in options) {
				titleText.innerHTML = options.title;
			}
			if ('column' in options) {
				column.innerHTML = options.column;
			}
			_onOpen();
		}
		function _onOpen() {
			var self     = this,
				duration = tool.state.animation.duration,
				$columns = this.$('.Q_columns_column');

			if (Q.info.isMobile) {
				tool.state.animation.css.show.width  = $(tool.element).width();

				if (state.fullscreenMobile) {
					tool.state.animation.css.show.height = $(window).height() - $(tool.element).offset().top - 10;
				}

				if ($columns.length > 0) {
					$columns.animate(tool.state.animation.css.hide, duration, function () {
						$columns.hide();
						openAnimation();
					});
				} else {
					openAnimation();
				}
			} else {
				openAnimation();
			}

			function openAnimation(){
				// open animation
				$(div).show().animate(tool.state.animation.css.show, duration, function(){
					$(this).find('.column_slot').height($(this).height());
				});

				afterAnimate();
			}

			function afterAnimate(){
				var $sc = $(state.container);

				if (Q.info.isTouchscreen) {
					$(column).css('overflow', 'auto');
				} else if (tool.state.scrollbarsAutoHide) {
					$(column).plugin('Q/scrollbarsAutoHide', options.scrollbarsAutoHide);
				}

				if (!Q.info.isMobile) {
					$sc.width(self.$('.Q_columns_column').length * self.$('.Q_columns_column').outerWidth(true));

					$(tool.element).animate({
						scrollLeft: tool.$('.Q_columns_container').width()
					}, duration);	
				}

				state.onOpen.handle(options, index);
				Q.handle(options.onOpen, self, [options, index]);
			}
		}
		function createTitle(){
			var $title = $('<h2 class="title"><span class="title_slot"></span></h2>');
			if (Q.info.isMobile) {
				$title.find('.title_slot').after('<div class="back">Back</div');
			} else {
				$title.find('.title_slot').after('<div class="close">x</div>');
			}
			return $title.get(0);
		}
	},

	close: function (index) {
		var div = this.column(index);
		var tool = this;
		var width = $(div).outerWidth(true);
		if (!div) {
			throw new Q.Exception("Column with index " + index + " doesn't exist");
		}
		var shouldContinue = tool.state.beforeClose.handle();
		if (shouldContinue === false) return;
		
		var $column = $(tool.column(index));
		var duration = tool.state.animation.duration;
		$column.animate(tool.state.animation.css.hide, duration, function () {
			Q.removeElement(tool.column(index));
			tool.state.columns[index] = null;
		
			if (index === tool.state.max-1) {
				--tool.state.max;
			}
			var $sc = $(tool.state.container);
			$sc.width($sc.width() - $(div).outerWidth(true));
		});
	},

	column: function (index) {
		return this.state.columns[index] || null;
	}
}
);

Q.Template.set('Q/columns/column',
	'<div class="Q_contextual"><ul class="Q_listing"></ul></div>'
);

})(Q, jQuery);