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
 *  @param {Q.Event} [options.onFilter] Use this event to fetch and display new results by calling tool.results(html). The first parameter is the content of the text input.
 * @return Q.Tool
 */
Q.Tool.define('Q/filter', function (options) {
	var tool = this;
	var state = tool.state;
	var $te = $(tool.element);
	
	if (!$te.children().length) {
		// set it up with javascript
		tool.$input = $('<input />')
		.attr({
			name: state.name,
			value: state.value,
			'class': 'Q_filter_input'
		}).appendTo(this.element);
		if (state.placeholders) {
			tool.$input.plugin('Q/placeholders', state.placeholders || {});
		}
		tool.$results = $('<div class="Q_filter_results" />')
			.appendTo(this.element);
	} else {
		tool.$input = tool.$('.Q_filter_input');
		tool.$results = tool.$('.Q_filter_results');
	}
	
	var _canceledBlur;
	tool.$input.on('focus', function () {
		tool.begin();
		_canceledBlur = true;
	}).on('blur', function () {
		setTimeout(function () {
			if (_canceledBlur) {
				_canceledBlur = false;
				return false;
			}
			tool.end();
		}, 100);
	}).on('keydown keyup change input focus paste blur Q_refresh', _changed)
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
	
	tool.$results.on(Q.Pointer.start, function () {
		_canceledBlur = true;
	});
	
	var lastVal = null;
	function _changed(event) {
		var $this = $(this);
		if (event.keyCode === 27) {
			$this.val('');
		}
		var val = $this.val();
		if (val != lastVal) {
			state.onFilter.handle.call(tool, val, this);
		}
		lastVal = val;
	};
	
	this.Q.onStateChanged('results').set(function () {
		this.$results.html(state.results);
	});

}, {
	name: 'filter',
	value: '',
	placeholder: 'Start typing...',
	placeholders: {},
	results: null,
	begun: false,
	fullscreen: Q.info.isMobile,
	onFilter: new Q.Event()
}, {
	begin: function () {
		var tool = this;
		var state = tool.state;
		if (state.begun) return;
		state.begun = true;
		
		tool.$input[0].copyComputedStyle(tool.$input[0]); // preserve styles
		
		var $te = $(tool.element);
		$te.addClass('Q_filter_begun');

		if (state.fullscreen) {
			tool.oldBodyOverflow = $('body').css('overflow');
			$('body').css('overflow', 'auto');
			tool.suspended = true;
			tool.$placeholder = $('<div class="Q_filter_placeholder" />')
				.insertAfter($te);
			$te.addClass('Q_filter_begun')
				.prependTo('body');
			$te.nextAll().each(function () {
				var $this = $(this);
				$this.data('Q/filter display', $this.css('display'));
				$this.css('display', 'none');
			});
			tool.$input.focus();
			setTimeout(function () {
				tool.suspended = false;
			}, 10);
		}
		
		var $container = tool.$input.parent('.Q_placeholder_container');
		var topH = tool.$input.outerHeight();
		if (!$container.length) {
			$container = tool.$input;
		} else {
			topH += parseInt(tool.$input.css('margin-top')) ;
		}
		var paddingW = parseInt(tool.$results.css('padding-left'))
			+ parseInt(tool.$results.css('padding-right'))
			+ parseInt(tool.$results.css('border-left'))
			+ parseInt(tool.$results.css('border-right'));
		tool.$results.insertAfter($container).css({
			left: $container[0].offsetLeft + 'px',
			top: $container[0].offsetTop + topH + 'px',
			width: $container.outerWidth() - paddingW
		}).show()
		.html('something<br>nice');
	},
	end: function () {
		var tool = this;
		var state = tool.state;
		if (!state.begun || tool.suspended) return;
		state.begun = false;
		var $te = $(tool.element);
		$te.removeClass('Q_filter_begun');
		$('body').css('overflow', tool.oldBodyOverflow);
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
		}
		return false;
	},
	results: function (newValue) {
		this.state.results = newValue;
		this.stateChanged('results');
	}
});

})(Q, jQuery);