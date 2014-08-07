(function (Q, $) {

/**
 * @module Q-tools
 */
	
/**
 * This tool contains functionality to show things in columns
 * @class Q tabs
 * @constructor
 * @param {Object} [options] This object contains properties for this function
 *  @param {Array} [options.tabs] An associative array of name: title pairs.

 * @return Q.Tool
 */
Q.Tool.define("Q/tabs", function(options) {

	var tool = this;
	var $te = $(tool.element);
	
	tool.state.max = 0;
	this.state.columns = {};
	this.state.triggers = {};
},

{
	onOpen: new Q.Event(function () { }, 'Q/columns'),
	beforeClose: new Q.Event(function () { }, 'Q/columns'),
	animation: { 
		duration: 500 // milliseconds
	},
	tagName: 'div'
},

{
	max: function () {
		return this.state.max;
	},
	
	push: function (url, slotName, options) {
		this.open(url, slotName, this.max(), options)
	},
	
	pop: function () {
		this.close(this.max()-1);
	},
	
	open: function (url, slotName, index, options) {
		var tool = this;
		var state = this.state;
		if (index > this.max()) {
			throw new Q.Exception("Q/columns open: index is too big");
		}
		if (index < 0) {
			throw new Q.Exception("Q/columns open: index is negative");
		}
		var div = this.column(index);
		if (!div) {
			div = document.createElement(this.state.tagName)
				.addClass('Q_column');
			this.element.appendChild(div); // trying to avoid jQuery just for practice
			++this.state.max;
			this.state.columns[index] = div;
		}
		if (slotName == null) {
			div.innerHTML = url;
			return state.onOpen.handle(url, slotName, index, options);
		}
		var slotContainer = {};
		slotContainer[slotName] = div;
		var o = Q.extend({
			slotNames: [slotName], 
			slotContainer: slotContainer,
			quiet: true,
			ignoreHistory: true
		}, options);
		o.onActivate = function _onActivate() {
			state.onOpen.handle(url, slotName, index, options);
		}
		// this.state.triggers[index] = options.trigger || null;
		Q.loadUrl(url, o);
	},

	close: function (index) {
		var div = this.column(index);
		if (!div) {
			throw new Q.Exception("Column with index " + index + " doesn't exist");
		}
		var shouldContinue = this.state.beforeClose.handle();
		if (shouldContinue === false) return;
		
		// this is the proper way to remove an element, so tools inside can be destructed:
		Q.removeElement(this.column(index));
		this.state.columns[index] = null;
		
		if (index === this.state.max-1) {
			--this.state.max;
		}
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