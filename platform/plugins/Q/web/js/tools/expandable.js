(function (Q, $) {
/**
 * @module Q-tools
 */
	
/**
 * Implements expandable containers that work on most modern browsers,
 * including ones on touchscreens.
 * @class Q expandable
 * @constructor
 * @param {Object} [options] Override various options for this tool
 *  @param {String} [options.title] Required. The title for the expandable.
 *  @param {String} [options.content] Required. The content.
 *  @param {Number} [options.count] A number, if any, to display when collapsed.
 *  @param {Boolean} [options.autoCollapseSiblings] Whether, when expanding an expandable, its siblings should be automatically collapsed.
 *  @param {Boolean} [options.scrollContainer] Closest parent element that could scroll
 * @return {Q.Tool}
 */
Q.Tool.define('Q/expandable', function (options) {
	var tool = this;
	var state = tool.state;
	var $te = $(tool.element);
	
	Q.addStylesheet('plugins/Q/css/expandable.css');
	
	if (!$te.children().length) {
		// set it up with javascript
		var count = options.count || '';
		var h2 = "<h2>"
			+"<span class='Q_expandable_count'>"+count+"</span>"
			+options.title
			+"</h2>";
		var div = "<div class='Q_expandable_content'>"+options.content+"</div>";
		this.element.innerHTML = h2 + div;
	}
	
	this.element.preventSelections(true);
	var $h2 = $('h2', $te)
	.on(Q.Pointer.fastclick, function () {
		var $h2 = $('h2', $te);
		if ($h2.hasClass('Q_selected')) {
			tool.collapse();
		} else {
			tool.expand();
		}
	}).on(Q.Pointer.start, function () {
		var $this = $(this);
		$this.addClass('Q_pressed');
		function f() {
			$this.removeClass('Q_pressed');
			$(window).off(Q.Pointer.end, f);
		}
		$(window).on(Q.Pointer.end, f);
	});
	if (!Q.info.isTouchscreen) {
		$h2.on('mouseenter', function () {
			$(this).addClass('Q_hover');
		}).on('mouseleave', function () {
			$(this).removeClass('Q_hover');
		});
	}
	tool.Q.onStateChanged('count').set(function () {
		$h2.find('.Q_expandable_count').html(state.count);
	});
}, {
	count: 0,
	expanded: false,
	autoCollapseSiblings: true,
	scrollContainer: true,
	duration: 300,
	beforeExpand: new Q.Event(),
	onExpand: new Q.Event(),
	beforeCollapse: new Q.Event()
}, {
	/**
	 * @method expand
	 * @param {Object} [options]
	 *  @param {Boolean} [options.autoCollapseSiblings] Whether, when expanding an expandable,
	 *  @param {Boolean} [options.scrollContainer] Closest parent element that could scroll
	 *  @param {Boolean} [options.scrollToElement] Can be used to specify another element to scroll to when expanding. Defaults to the title element of the expandable.
	 * @param {Function} [callback] the function to call once the expanding has completed
	 */
	expand: function (options, callback) {
		var tool = this;
		var state = tool.state;
		if (false === Q.handle(state.beforeExpand, this, [])) {
			return false;
		}
		var o = Q.extend({}, tool.state, options);
		var $te = $(this.element);
		var $h2 = $('h2', $te);
		var $parent = $te.parent();
		if (o.autoCollapseSiblings) {
			$('.Q_expandable_tool h2', $parent).not(this)
			.removeClass('Q_selected')
			.next().slideUp(state.duration).each(function () {
				var t = this.parentNode.Q("Q/expandable");
				Q.handle(t.state.beforeCollapse, t, [tool]);
			});
		}
		var $expandable = $h2.addClass('Q_selected')
		.next().slideDown(state.duration);
		var $scrollable = this.scrollable();
		var offset = $scrollable
			? $scrollable.offset()
			: {left: 0, top: 0};
		var $element = o.scrollToElement ? $(o.scrollToElement) : $h2;
		var t1 = $element.offset().top - offset.top;
		var h1 = $element.height();
		Q.Animation.play(function (x, y) {
			if (!o.scrollContainer) return;
			if ($scrollable) {
				var t = $element.offset().top - offset.top;
				var scrollTop = $scrollable.scrollTop() + t - t1 * (1-y) - h1/2;
				$scrollable.scrollTop(scrollTop);
			}
			$expandable.css('overflow', 'visible');
		}, state.duration).onComplete.set(function () {
			Q.handle(callback, tool, []);
			Q.handle(state.onExpand, tool, []);
		});
		state.expanded = true;
	},
	
	collapse: function () {
		var tool = this;
		var state = this.state;
		var $h2 = $('h2', this.element);
		$h2.removeClass('Q_selected')
		.next().slideUp(state.duration).each(function () {
			var t = this.parentNode.Q("Q/expandable");
			Q.handle(t.state.beforeCollapse, t, [tool]);
		});
		state.expanded = false;
	},
	
	scrollable: function () {
		var $scrollable = $('body');
		$(this.element).parents().each(function () {
			var $this = $(this);
			var overflow = $this.css('overflow');
			if (['hidden', 'visible'].indexOf(overflow) < 0) {
				$scrollable = $this;
				return false;
			}
		});
		return $scrollable;
	}
});

})(Q, jQuery);