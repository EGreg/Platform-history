(function (Q, $, window, document, undefined) {

/**
 * Makes a contextual menu from given options and handles its showing / hiding.
 * @param options Object A hash of options that can include
 *	 "items": Array of objects each of which must have the structure:
 *	 {
 *	   "content": html content or element or jQuery,
 *	   "attributes": {
 *	     // Item attributes which actually a "data" attributes,
 * 	     // so action will become "data-action" for this item.
 *	     "action": "[some-action]"
 *	   }
 *	 }
 *   "className": Optional. CSS class name for additional styling.
 *	 "defaultHandler": Optional. Q.Event, function or 
 *     function name which is called when personal handler for selected item is not defined.
 *	 "size": Options. Hash of { width: Number, height: Number }
 * 	   values to override default contextual size.
 *	   So you can use just one handler for whole contextual or provide separate handlers for each item.
 */
Q.Tool.jQuery('Q/contextual', function (o) {

	var $this = $(this);
	if ($this.state('Q/contextual')) {
		$this.remove('Q/contextual');
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
	var listing = $('<ul class="Q_listing" />');
	var item = null, listItem = null;
	if (o.items) {
		for (var i = 0; i < o.items.length; i++) {
			item = o.items[i];
			listItem = $('<li />').append(item.content);
			if (item.attributes) {
				for (var name in item.attributes) {
					listItem.attr('data-' + name, item.attributes[name]);
				}
			}
			listing.append(listItem);
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