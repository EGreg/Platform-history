(function (Q, $) {

/**
 * @param options Object
 *  The options to pass to the tool. They include:
 *  "tabs": An associative array of name: title pairs.
 *  "urls": An associative array of name: url pairs to override the default urls.
 *  "field" => Defaults to "tab". Uses this field when urls doesn't contain the tab name.
 *  "selector": CSS style selector indicating the element to update with javascript. Can be a parent of the tabs. Set to null to reload the page.
 *  "slot": The name of the slot to request when changing tabs with javascript.
 *  "loader": Optional. Name of a function which takes url, slot, callback. It should call the callback and pass it an object with the response info. Can be used to implement caching, etc. instead of the default HTTP request. This function shall be Q.batcher getter
 *  "onClick": Optional. Event when a tab was clicked, with arguments (name, element). Returning false cancels the tab switching.
 *  "beforeSwitch": Optional. Event when tab switching begins. Returning false cancels the switching.
 *  "beforeScripts": Optional. Name of the function to execute after tab is loaded but before its javascript is executed.
 *  "onActivate": Optional. Name of the function to execute after a tab is activated.
 * @return Q.Tool
 *  A tool that has the following methods:
 *  switchTo(name) : Given the name of a tab, switches to that tab as if it was clicked.
 */
Q.Tool.define("Q/tabs", function(options) {

	var tool = this;
	var $te = $(tool.element);
	
	$te.on([Q.Pointer.fastclick, '.Q_tabs'], '.Q_tabs_tab', function () {
		if (false === tool.state.onClick.handle.call(tool, this.getAttribute('data-name'), this)) {
			return;
		}
		if (Q.Pointer.canceledClick || $('.Q_discouragePointerEvents', tool.element).length) {
			return;
		}
		var element = this;
		setTimeout(function () {
			tool.switchTo(element.getAttribute('data-name'), element);	
		}, 0);
	}).click(function (event) {
		event.preventDefault();
		// return false;
	});
	
	Q.onLayout.set(function () {
		tool.refresh();
	}, tool);
	
	tool.refresh();
	tool.indicateSelected();
	
},

{
	field: 'tab',
	slot: 'content,title',
	selector: '#content_slot',
	overflow: '{{count}} more &#9660;',
	loadUrlOptions: {},
	loader: Q.req,
	onClick: new Q.Event(),
	beforeSwitch: new Q.Event(),
	onActivate: new Q.Event()
},

{
	switchTo: function (name, tab, extra) {
		if (tab === undefined) {
			$('.Q_tabs_tab', this.element).each(function () {
				if (this.getAttribute('data-name') === name) {
					tab = this;
					return false;
				}
			});
			if (tab === undefined) {
				console.warn('Q/tabs: no tab with name "' + name + '"');
				return false;
			}
		}

		var state = this.state;

		state.slots = typeof state.slot === "string" 
			? state.slot.split(',')
			: state.slot;
		state.selectors = typeof state.selector === "string"
			? [state.selector]
			: state.selector

		var slots = state.slots;
		var selectors = state.selectors;

		href = this.getUrl(tab);

		if (false === Q.handle(state.beforeSwitch, this, [tab, href, extra])) {
			return false;
		}

		if (href && state.selector === null) {
		    Q.handle(href);
			return;
		}

		if (!slots || !selectors || !href) {
			return;
		}

		var tool = this;
		var o = Q.extend({
			slotNames: slots,
			onError: {"Q/tabs": function (msg) {
				alert(msg);
			}},
			onActivate: {"Q/tabs": function () {
				tool.indicateSelected(tab);
				state.onActivate.handle(tab);
			}},
			loadExtras: true,
			loader: state.loader
		}, state.loadUrlOptions);
		Q.handle(href, o);
	},
	
	indicateSelected: function (tab) {
		var $tabs = this.$('.Q_tabs_tab');
		var url = window.location.href.split('#')[0];
		var tool = this;
		$tabs.removeClass('Q_selected');
		if (!tab) {
			$tabs.each(function (k, t) {
				if (tool.getUrl(t) === url) {
					tab = t;
					return false;
				}
			});
		}
		$(tab).addClass('Q_selected');
	},
	
	getUrl: function (tab) {
		var $tab = $(tab);
		var state = this.state;
		var href = tab.getAttribute('href');
		var name = tab.getAttribute("data-name");
		if (!href) {
			href = state.urls && state.urls[name];
		}
		if (!href) {
			href = window.location.href.split('?')[0]
				+ '?' + window.location.search.queryField(state.field, name);
		}
		return href;
	},
	
	refresh: function (options) {
		var tool = this;
		var $te = $(this.element);
		var w = $te.width(), w2 = 0, w3 = 0, index = -10;
		var $o = $('.Q_tabs_overflow', $te);
		if ($o.length) {
			if ($o.data('Q_contextual')) {
				$('.Q_tabs_tab', $o.data('Q_contextual')).insertAfter($o);	
			}
			$o.plugin("Q/contextual", "remove");
			$o.remove();
		}
		var $tabs = $('.Q_tabs_tab', $te);
		var $overflow, $lastVisibleTab;
		$tabs.each(function (i) {
			var $t = $(this);
			w3 = w2;
			w2 += $t.outerWidth(true);
			if (w2 > w) {
				index = i-1;
				return false;
			}
		});
		if (index >= 0) {
			$lastVisibleTab = $tabs.eq(index);
			$overflow = $('<a class="Q_tabs_tab Q_tabs_overflow" />')
			.html(this.state.overflow.interpolate({
				count: $tabs.length - index - 1
			}));
			$overflow.insertAfter($lastVisibleTab);
			if ($overflow.outerWidth(true) > w - w3) {
				--index;
				$lastVisibleTab = $tabs.eq(index);
				$overflow.insertAfter($lastVisibleTab)
				.html(this.state.overflow.interpolate({
					count: $tabs.length - index - 1
				}));
			}
		}
		
		if ($overflow) {
			Q.addScript("plugins/Q/js/QTools.js", function () {
				var items = [], $tab;
				for (var i=index+1; i<$tabs.length; ++i) {
					$tab = $tabs.eq(i);
					items.push({
						content: $tab,
						attributes: {
							name: $tab.attr('data-name')
						}
					});
				}
				$overflow.plugin("Q/contextual", {
					items: items,
					defaultHandler: function ($tab) {
						tool.switchTo($tab.attr('data-name'), $tab[0]);
					}
				});
			});
		}
	}
}
);

Q.Template.set('Q/tabs/contextual',
	'<div class="Q_contextual"><ul class="Q_listing"></ul></div>'
);

})(Q, jQuery);