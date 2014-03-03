(function ($) {

/**
 * @param options Object
 *  The options to pass to the tool. They include:
 *  "tabs": An associative array of name: title pairs.
 *  "urls": An associative array of name: url pairs to override the default urls.
 *  "selector": CSS style selector indicating the element to update with javascript. Can be a parent of the tabs. Set to null to reload the page.
 *  "slot": The name of the slot to request when changing tabs with javascript.
 *  "loader": Optional. Name of a function which takes url, slot, callback. It should call the callback and pass it an object with the response info. Can be used to implement caching, etc. instead of the default HTTP request. This function shall be Q.batcher getter
 *  "beforeSwitch": Optional. Name of the function to execute before tab switching begins.
 *  "beforeScripts": Optional. Name of the function to execute after tab is loaded but before its javascript is executed.
 *  "onActivate": Optional. Name of the function to execute after a tab is activated.
 * @return Q.Tool
 *  A tool that has the following methods:
 *  switchTo(name) : Given the name of a tab, switches to that tab as if it was clicked.
 */
Q.Tool.define("Q/tabs", function(options) {

	var tool = this;
	
	$(tool.element).on([Q.Pointer.fastclick, '.Q_tabs'], '.Q_tabs_tab', function () {
		tool.switchTo(this.getAttribute('data-name'));
	}).click(function () {
		return false;
	});
	
},

{
	loader: Q.req,
	beforeSwitch: new Q.Event(),
	slot: 'content,title',
	selector: '#content_slot'
},

{
	switchTo: function (name, tab) {
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

		Q.handle(state.beforeSwitch, this, [tab, state]);
		var slots = state.slots;
		var selectors = state.selectors;
		var href = tab.getAttribute('href');
		
		if (!href) {
			href = state.urls && state.urls[tab.getAttribute("data-name")];
		}

		if (href && state.selector === null) {
		    Q.handle(href);
			return;
		}

		if (!slots || !selectors || !href) {
			return;
		}

		var te = this.element;
		Q.loadUrl(href, {
			slotNames: slots,
			onError: function (msg) {
				alert(msg);
			},
			onActivate: function () {
				$('.Q_tabs_tab', te).removeClass('Q_selected');
				$(tab).addClass('Q_selected');
			},
			loadExtras: true,
			loader: state.loader
		});
	}
}
);

})(jQuery);