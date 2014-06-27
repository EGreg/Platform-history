(function (Q, $) {

/**
 * This method crates tabbed panel from given element
 * Returns  A tool (Q.Tool) that has the following methods:
 *  switchTo(name) : Given the name of a tab, switches to that tab as if it was clicked.
 * @method tabs
 * @param {Object} [options] This object contains properties for this function
 *  @param {Array} [options.tabs] An associative array of name: title pairs.
 *  @param {Array} [options.urls] An associative array of name: url pairs to override the default urls.
 *  @param {String} [options.field] Uses this field when urls doesn't contain the tab name.
 *  @default 'tab'
 *  @param {String} [options.selector] CSS style selector indicating the element to update with javascript. Can be a parent of the tabs. Set to null to reload the page.
 *  @param {String} [options.slot] The name of the slot to request when changing tabs with javascript.
 *  @param {Function} [options.loader] Name of a function which takes url, slot, callback. It should call the callback and pass it an object with the response info. Can be used to implement caching, etc. instead of the default HTTP request. This function shall be Q.batcher getter
 *  @param {Event} [options.onClick] Event when a tab was clicked, with arguments (name, element). Returning false cancels the tab switching. Optional.
 *  @param {Event} [options.beforeSwitch] Event when tab switching begins. Returning false cancels the switching. Optional.
 *  @param {Function} [options.beforeScripts] Name of the function to execute after tab is loaded but before its javascript is executed. Optional.
 *  @param {Function} [options.onActivate] Name of the function to execute after a tab is activated. Optional.
 * @return Q.Tool
 */
Q.Tool.define("Q/tabs", function(options) {

	var tool = this;
	var $te = $(tool.element);
	
	// catches events that bubble up from any child elements
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
			ignoreHistory: this.isInDialog(),
			loader: state.loader
		}, state.loadUrlOptions);

		Q.handle(href, o);
	},
	
	isInDialog: function() {
		return !!$(this.element).parents('.Q_overlay').length;
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
				var elements = [];
				for (var i=index+1; i<$tabs.length; ++i) {
					elements.push($tabs.eq(i));
				}
				$overflow.plugin("Q/contextual", {
					elements: elements,
					defaultHandler: function ($tab) {
						tool.switchTo($tab.attr('data-name'), $tab[0]);
					},
					className: "Q_tabs_contextual"
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