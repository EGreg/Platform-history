(function (Q, $) {
/**
 * @module Q-tools
 */
	
/**
 * Implements an input that filters an associated list (like an autocomplete)
 * @class Q filter
 * @constructor
 * @param {Object} [options] Override various options for this tool
 *  @param {String} [options.name='filter'] The name of the text input
 *  @param {String} [options.value=''] The initial value of the text input
 *  @param {String} [options.placeholder] Any placeholder text
 *  @param {Object} [options.placeholders={}] Options for Q/placeholders, or null to omit it
 *  @param {String} [options.results=''] HTML to display in the results initially. If setting them later, remember to call stateChanged('results')
 *  @param {Q.Event} [options.onFilter] This event handler is meant to fetch and update results by editing the contents of the element pointed to by the second argument. The first argument is the content of the text input.
 * @return {Q.Tool}
 */
Q.Tool.define('Q/filter', function (options) {
	var tool = this;
	var state = tool.state;
	var $te = $(tool.element);
	
	Q.addStylesheet('plugins/Q/css/filter.css');
	
	if (!$te.children().length) {
		// set it up with javascript
		tool.$input = $('<input />')
		.attr({
			name: state.name,
			value: state.value,
			'class': 'Q_filter_input',
			placeholder: state.placeholder
		}).appendTo(this.element);
		if (state.placeholders) {
			tool.$input.plugin('Q/placeholders', state.placeholders);
		}
		tool.$results = $('<div class="Q_filter_results" />')
			.appendTo(this.element);
	} else {
		tool.$input = tool.$('.Q_filter_input');
		tool.$results = tool.$('.Q_filter_results');
	}
	if ($te.css('position') === 'static') {
		$te.css('position', 'relative');
	}
	
	var events = 'focus ' + Q.Pointer.start;
	var wasAlreadyFocused = false;
	tool.$input.on(events, function () {
		if (wasAlreadyFocused) return;
		wasAlreadyFocused = true;
		tool.begin();
	}).on('blur', function () {
		wasAlreadyFocused = false;
		setTimeout(function () {
			if (tool.canceledBlur) {
				tool.canceledBlur = false;
				return false;
			}
			tool.end();
		}, 100);
	})
	.on('keydown keyup change input focus paste blur Q_refresh Q_refresh_filter', _changed)
	.on(Q.Pointer.fastclick, function (evt) {
		var $this = $(this);
		var xMax = $this.offset().left + $this.outerWidth(true) -
			parseInt($this.css('margin-right'));
		var xMin = xMax - parseInt($this.css('padding-right'));
		var x = Q.Pointer.getX(evt);
		if (xMin < x && x < xMax) {
			$this.val('').trigger('Q_refresh');
			return tool.end();
		}
	});
	$te.addClass(state.fullscreen ? 'Q_filter_fullscreen' : 'Q_filter_notFullscreen');
	
	tool.$results.on(Q.Pointer.start+' '+Q.Pointer.end, function () {
		if (Q.info.isTouchscreen) {
			tool.canceledBlur = true;
		}
	});
	
	var lastVal = null;
	function _changed(event) {
		var $this = $(this);
		if (event.keyCode === 27) {
			$this.val('');
			tool.end();
		}
		var val = $this.val();
		if (val != lastVal) {
			state.onFilter.handle.call(tool, val, tool.$results[0]);
		}
		lastVal = val;
	};
	
	this.Q.onStateChanged('results').set(function () {
		this.$results.empty().append(state.results);
	});

}, {
	name: 'filter',
	value: '',
	placeholder: 'Start typing...',
	placeholders: {},
	results: null,
	begun: false,
	delayTouchscreen: 500,
	fullscreen: Q.info.isMobile,
	onFilter: new Q.Event()
}, {
	begin: function () {
		var tool = this;
		tool.canceledBlur = true;
		var state = tool.state;
		if (state.begun) return;
		state.begun = true;
		
		tool.$input[0].copyComputedStyle(tool.$input[0]); // preserve styles
		
		var $te = $(tool.element);
		$te.addClass('Q_filter_begun');

		if (state.fullscreen) {
			// on slower mobile browsers, the following might synchronously lag a bit
			var $body = $('body');
			state.oldBodyOverflow = $body.css('overflow');
			$body.css('overflow', 'auto')
				.addClass('Q_overflow');
			if (Q.info.isTouchscreen) {
				Q.ensure(
					window.overthrow, 
					"plugins/Q/js/overthrow.js",
					function () {
						overthrow.scrollIndicatorClassName = 'Q_overflow';
						overthrow.set();
					}
				)
			}
			tool.suspended = true;
			Q.Pointer.cancelClick();
			tool.$placeholder = $('<div class="Q_filter_placeholder" />')
				.insertAfter($te);
			$te.addClass('Q_filter_begun')
				.prependTo('body');
			$te.nextAll().each(function () {
				var $this = $(this);
				$this.data('Q/filter display', $this.css('display'));
				$this.css('display', 'none');
			});
			Q.Masks.show(tool);
			tool.$input.focus();
			setTimeout(function () {
				tool.suspended = false;
			}, 10);
			setTimeout(function () {
				Q.Masks.hide(tool);
			}, state.delayTouchscreen); // to prevent touchend events from wreaking havoc
		}
		
		var $container = tool.$input.parent('.Q_placeholders_container');
		var topH = tool.$input.outerHeight();
		if (!$container.length) {
			$container = tool.$input;
		} else {
			topH += parseInt(tool.$input.css('margin-top')) ;
		}
		tool.$results.insertAfter($container).css({
			left: 0,
			width: $container.outerWidth(),
			"box-sizing": 'border-box',
			top: state.fullscreen 
				? 0
				: $container.offset().top - $te.offset().top + topH
		}).show();
	},
	end: function () {
		var tool = this;
		var state = tool.state;
		if (!state.begun || tool.suspended) return;
		state.begun = false;
		var $te = $(tool.element);
		$te.removeClass('Q_filter_begun');
		tool.$results.hide();
		if (state.fullscreen) {
			$te.nextAll().each(function () {
				var $this = $(this);
				$this.css('display', $this.data('Q/filter display'))
					.removeData('Q/filter display');
			});
			$te.insertAfter(tool.$placeholder);
			tool.$placeholder.remove();
			tool.$input.blur();
			$('body').css('overflow', state.oldBodyOverflow)
			.removeClass('Q_overflow');
		}
		return false;
	}
});

})(Q, jQuery);