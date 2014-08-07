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
	
	this.state.container = document.createElement('div')
		.addClass('Q_columns_container');
	this.element.appendChild(this.state.container);
	
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
	tagName: 'div',
	scrollbarsAutoHide: {}
},

{
	max: function () {
		return this.state.max;
	},
	
	push: function (options) {
		this.open(options, this.max())
	},
	
	pop: function () {
		this.close(this.max()-1);
	},
	
	open: function (options, index) {
		var tool = this;
		var state = this.state;
		if (index > this.max()) {
			throw new Q.Exception("Q/columns open: index is too big");
		}
		if (index < 0) {
			throw new Q.Exception("Q/columns open: index is negative");
		}
		var div = this.column(index);
		var title, column;
		if (!div) {
			div = document.createElement(this.state.tagName)
				.addClass('Q_columns_column');
			++this.state.max;
			this.state.columns[index] = div;
			title = document.createElement('h2').addClass('title_slot');
			column = document.createElement('div').addClass('column_slot');
			div.appendChild(title);
			div.appendChild(column);
			this.state.container.appendChild(div);
		}
		if (options.url) {
			var url = options.url;
			var o = Q.extend({
				slotNames: ["title", "column"], 
				slotContainer: {
					title: title,
					column: column
				},
				quiet: true,
				ignoreHistory: true
			}, options);
			o.handler = function _handler(response) {
				var elementsToActivate = [];
				if ('title' in response.slots) {
					title.innerHTML = response.slots.title;
					elementsToActivate['title'] = title;
				}
				column.innerHTML = response.slots.column;
				elementsToActivate['column'] = column;
				return elementsToActivate;
			};
			o.onActivate = _onOpen;
			// this.state.triggers[index] = options.trigger || null;
			Q.loadUrl(url, o);
		} else {
			if ('title' in options) {
				title.innerHTML = options.title;
			}
			if ('column' in options) {
				column.innerHTML = options.column;
			}
			_onOpen();
		}
		function _onOpen() {
			state.onOpen.handle(options, index);
			if (tool.state.scrollbarsAutoHide) {
				$(column).plugin('Q/scrollbarsAutoHide', options.scrollbarsAutoHide);
			}
		}
		setTimeout(function () {
			var $sc = $(state.container);
			$sc.width($sc.width() + $(div).outerWidth(true));
		}, 0);
	},

	close: function (index) {
		var div = this.column(index);
		var width = $(div).outerWidth(true);
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
		var $sc = $(this.state.container);
		$sc.width($sc.width() - $(div).outerWidth(true));
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