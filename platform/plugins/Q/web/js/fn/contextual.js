(function (Q, $, window, document, undefined) {


/**
 * Q Tools
 * @module Q-tools
 */

/**
 * This plugin Makes a contextual menu from given options and handles its showing / hiding.
 * @class Q contextual
 * @constructor
 * @param {Object} [options] options an object of options that can include
 * @param {Array} [options.elements] elements is an array of LI elements to add
 * @param {String} [options.className] className is a CSS class name for additional styling. Optional
 * @default ''
 * @param {Q.Event} [options.defaultHandler] defaultHandler is a  Q.Event, function or
 *     function name which is called when personal handler for selected item is not defined. Optional
 * @default null
 * @param {Object} [options.size] size is an object with values for override default contextual size.
 * So you can use just one handler for whole contextual or provide separate handlers for each item.
 * @default null
 * @param {Number} [options.size.width] width
 * @param {Number} [options.size.height] height
 */
Q.Tool.jQuery('Q/contextual', function _Q_contextual(o) {

	var $this = $(this);
	if ($this.data('Q_contextual')) {
		return;
	}

	// the first time when any contextual is added we need to preload its graphics,
	if ($('.Q_contextual_arrows_preloaded').length == 0) {
		$('<div class="Q_contextual_arrows_preloaded Q_contextual">' +
			'<div class="Q_contextual_top_arrow"></div>' +
			'<div class="Q_contextual_bottom_arrow"></div>' +
		'</div>').appendTo(document.body);
	}
	if (o.defaultHandler && Q.typeOf(o.defaultHandler) != 'Q.Event' &&
	typeof(o.defaultHandler) != 'function' && typeof(o.defaultHandler) != 'string') {
		alert("Default handler must be a valid Q.Event object, function or function string name.");
	}
	
	if ($this.hasClass('Q_selected')) {
		$this.removeClass('Q_selected');
		$this.data('Q_restore_selected', true);
	}

	var contextual = $('<div class="Q_contextual" />');
	if (o.className) contextual.addClass(o.className);
	var listingWrapper = $('<div class="Q_listing_wrapper" />');
	if (o.defaultHandler) {
		if (typeof(o.defaultHandler) == 'string') {
			contextual.attr('data-handler', o.defaultHandler);
		} else {
			contextual.data('defaultHandler', o.defaultHandler);
		}
	}
	var listing = $('<ul class="Q_listing" />'), i;
	if (o.elements) {
		for (i = 0; i < o.elements.length; ++i) {
			listing.append(o.elements[i]);
		}
	}
	contextual.append(listingWrapper.append(listing));
	$(document.body).append(contextual);

	var cid = Q.Contextual.add($this, contextual, null, o.size);
	$this.data('Q_contextual_id', cid);
	$this.data('Q_contextual', contextual);
},

{
	'className': '',
	'defaultHandler': null,
	'size': null
},

{
	/**
	 * Removes the contextual functionality from the element
	 * @method remove
	 */
	remove: function () {
		var $this = $(this);
		var cid = $this.data('Q_contextual_id');
		if (cid !== undefined) {
			var removed = Q.Contextual.remove(cid);
			removed.contextual.remove();
		}
		if ($this.data('Q_restore_selected')) {
			$this.addClass('Q_selected');
			$this.data('Q_restore_selected');
		}
		$this.removeData('Q_contextual_id');
		$this.removeData('Q_contextual');
	}
}

);

})(Q, jQuery, window, document);