(function (Q, $, window, document, undefined) {

/**
 * Just a helper for iScroll plugin.
 * Needed to simplify applying iScroll and Q/scrollIndicators plugins.
 * @param options Object or string
 *	 If an Object, then it's a hash of options, similar to these passed to iScroll plus additional parameters:
 *		 "indicators": Defaults to true. Whether to show scroll indicators (apply Q/scrollIndicators plugin).
 *	 If a string, then it's a command which may be:
 *		 "destroy": Destroys iScroll together with Q/scrollIndicators.
 */
Q.Tool.jQuery("Q/iScroll", function (o) {

	var $this = $(this);
	Q.addScript('plugins/Q/js/iscroll.js', function () {
		if (o.jScrollPane) {
			$this.jScrollPane(o);	
		} else if ($this[0].children.length) {
			$this.data('Q/iScroll', new iScroll($this[0], o));
		}
		if (o.indicators)
		{
			setTimeout(function()
			{
				$('.jspContainer').css('top', '0px');
				if ($this.data('Q/iScroll'))
				{
					$this.plugin('Q/scrollIndicators', 'destroy')
					.plugin('Q/scrollIndicators', {
						'type': 'iScroll',
						'scroller': $this.data('Q/iScroll'),
						'orientation': ($this[0].scrollHeight > $this[0].offsetHeight ? 'v' : 'h')
					});
				}
			}, 0);
		}
	});
},

{
	'x': 0,
	'y': 0,
	'hScrollbar': false,
	'vScrollbar': false,
	'hScroll': false,
	'hideScrollbar': true,
	'fadeScrollbar': true,
	'useTransition': false,
	'topOffset': 0,
	'onRefresh': null,
	'onBeforeScrollStart': null,
	'onScrollStart': null,
	'onScrollMove': null,
	'onScrollEnd': null,
	'onTouchEnd': null,
	
	'showArrows': true,
	'horizontalGutter': 1,
	'verticalGutter': 1,
	'maintainPosition': true,
	'autoReinitialize': true,
	'animateScroll': true,
	'hijackInternalLinks': true,
	
	'indicators': true
},

{
	refresh: function () {
		return this.each(function() {
			var $this = $(this);
			if ($this.state('Q/iScroll'))
			{
				//$this.data('Q/iScroll').refresh();
				$this.plugin('Q/scrollIndicators', 'destroy')
				.plugin('Q/scrollIndicators', {
					'type': 'iScroll',
					'scroller': $this.data('Q/iScroll'),
					'orientation': ($this[0].scrollHeight > $this[0].offsetHeight ? 'v' : 'h')
				});
			}
		});
	},

	destroy: function () {
		return this.each(function() {
			var $this = $(this);
			$this.plugin('Q/scrollIndicators', 'destroy');
			var iScroll = $this.data('Q/iScroll');
			if (iScroll)
				$this.data('Q/iScroll').destroy();
			$this.removeData('Q/iScroll');
			$this.removeData('Q/iScroll options');
		});
	}
}

);

})(Q, jQuery, window, document);