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
 *  @Param {Boolean} [options.autoCollapseSiblings] Whether, when expanding an expandable, its siblings should be automatically collapsed.
 * @return Q.Tool
 */
Q.Tool.define('Q/expandable', function (options) {
	var tool = this;
	var state = tool.state;
	var $te = $(tool.element);
	
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
	beforeExpand: new Q.Event(),
	onExpand: new Q.Event(),
	beforeCollapse: new Q.Event()
}, {
	expand: function (options) {
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
			.next().slideUp(300).each(function () {
				var t = this.parentNode.Q("Q/expandable");
				Q.handle(t.state.beforeCollapse, t, [tool]);
			});
		}
		var $expandable = $h2.addClass('Q_selected')
		.next().slideDown(300);
		var $scrollable = null;
		$te.parents().each(function () {
			var $this = $(this);
			var overflow = $this.css('overflow');
			if (['hidden', 'visible'].indexOf(overflow) < 0) {
				$scrollable = $this;
				return false;
			}
		});
		var t1 = $h2.offset().top - $scrollable.offset().top;
		var h1 = $h2.height();
		Q.Animation.play(function (x, y) {
			if (!o.scrollContainer) return;
			if ($scrollable) {
				var t = $h2.offset().top - $scrollable.offset().top;
				var scrollTop = $scrollable.scrollTop() + t - t1 * (1-y) - h1/2;
				$scrollable.scrollTop(scrollTop);
			}
			$expandable.css('overflow', 'visible');
		}, 300).onComplete.set(function () {
			Q.handle(state.onExpand, tool, []);
		});
		state.expanded = true;
	},
	
	collapse: function () {
		var tool = this;
		var state = this.state;
		var $h2 = $('h2', this.element);
		$h2.removeClass('Q_selected')
		.next().slideUp(300).each(function () {
			var t = this.parentNode.Q("Q/expandable");
			Q.handle(t.state.beforeCollapse, t, [tool]);
		});
		state.expanded = false;
	}
});

})(Q, jQuery);