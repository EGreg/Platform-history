(function (Q, $) {
/**
 * @module Q-tools
 */
	
/**
 * Implements an input that filters an associated list (like an autocomplete)
 * @class Q filter
 * @constructor
 * @param {Object} [options] Override various options for this tool
 *  @param {String} [options.name=filter] The name of the text input
 *  @param {String} [options.value=''] The initial value of the text input
 *  @param {String} [options.placeholder] Any placeholder text
 *  @param {Object} [options.placeholders={}] Options for Q/placeholders, or null to omit it
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
	
	tool.$input.on('focus', function () {
		tool.begin();
	}).on('blur', function () {
		tool.end();
	});

}, {
	name: 'filter',
	value: '',
	placeholder: 'Start typing...',
	placeholders: {},
	begun: false
}, {
	begin: function () {
		var tool = this;
		var state = tool.state;
		if (state.begun) return;
		state.begun = true;
		
		if (Q.info.isMobile) {
			tool.suspended = true;
			var $te = $(tool.element);
			tool.$input[0].copyComputedStyle(tool.$input[0]); // preserve styles
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
		tool.$results.hide();
		if (!Q.info.isMobile) {
			setTimeout(function () {
				var $te = $(tool.element);
				$te.nextAll().each(function () {
					var $this = $(this);
					$this.css('display', $this.data('Q/filter display'))
						.removeData('Q/filter display');
				});
				$te.removeClass('Q_filter_begun')
					.insertAfter(tool.$placeholder);
				tool.$placeholder.remove();
			}, 100000);
		}
	}
});

})(Q, jQuery);