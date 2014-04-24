(function (Q, $, window, document, undefined) {

/**
 * Makes a contextual menu from given options and handles its showing / hiding.
 * @param options Object or string
 *	 If an Object, then it's a hash of options, that can include:
 *		 "items": Required. Array of objects each of which must have such structure:
 *		 {
 *			 'contents': '[item html contents]',
 *			 'attrs': {
 *				 // Item attributes which actually a "data" attributes,
 * 				    so action will become "data-action" for this item.
 *				 'action': '[some-action]'
 *				 // Commonly used attribute is 'handler'
 *					which is javascript function that called when item selected.
 *				 'handler': '[javascript function name]'
 *			 }
 *		 }
 *   "className": Optional. CSS class name for additional styling.
 *		 "defaultHandler": Optional. Q.Event, function or 
 * 				function name which is called when personal handler for selected item is not defined.
 *		 "size": Options. Hash of { 'width': 'value', 'height': 'value' }
 * 				values to override default contextual size.
 *		 	So you can use just one handler for whole contextual or provide separate handlers for each item.
 *
 *	 If a string, then it's a command which may be:
 *		 "destroy": Destroys contextual so it won't work anymore.
 */
Q.Tool.jQuery('Q/contextual', function (o) {

	// the first time when any contextual is added we need to preload its graphics, arrows particularly
	if ($('.Q_contextual_arrows_preloaded').length == 0)
	{
		$('<div class="Q_contextual_arrows_preloaded Q_contextual">' +
				'<div class="Q_contextual_top_arrow"></div>' +
				'<div class="Q_contextual_bottom_arrow"></div>' +
			'</div>').appendTo(document.body);
	}
	
	if (!o.items)
	{
		alert("Please provide 'items' for the contextual.");
		return false;
	}
	if (o.defaultHandler && Q.typeOf(o.defaultHandler) != 'Q.Event' &&
			typeof(o.defaultHandler) != 'function' && typeof(o.defaultHandler) != 'string')
	{
		alert("Default handler must be a valid Q.Event object, function or function string name.");
	}
	return this.each(function(index)
	{
		var $this = $(this);
		
		if ($this.hasClass('Q_highlighted'))
		{
			$this.removeClass('Q_highlighted');
			$this.data('Q_restore_highlight', true);
		}
		
		var contextual = $('<div class="Q_contextual" />');
		if (o.className) contextual.addClass(o.className);
		var listingWrapper = $('<div class="Q_listing_wrapper" />');
		if (o.defaultHandler)
		{
			if (typeof(o.defaultHandler) == 'string')
				contextual.attr('data-handler', o.defaultHandler);
			else
				contextual.data('defaultHandler', o.defaultHandler);
		}
		var listing = $('<ul class="Q_listing" />');
		var item = null, listItem = null;
		for (var i = 0; i < o.items.length; i++)
		{
			item = o.items[i];
			listItem = $('<li>' + item.contents + '</li>');
			if (item.attrs)
			{
				for (var name in item.attrs)
				{
					listItem.attr('data-' + name, item.attrs[name]);
				}
			}
			listing.append(listItem);
		}
		listingWrapper.append(listing);
		contextual.append(listingWrapper);
		$(document.body).append(contextual);
		
		var cid = Q.Contextual.add($this, contextual, null, o.size);
		$this.data('Q_contextual_id', cid);
	});
},

{
	'className': '',
	'defaultHandler': null,
	'size': null
},

{
	destroy: function () {
		return this.each(function(index)
		{
			var $this = $(this);
			var cid = $this.data('Q_contextual_id');
			if (cid !== undefined)
			{
				var removed = Q.Contextual.remove(cid);
				removed.contextual.remove();
			}
			if ($this.data('Q_restore_highlight'))
				$this.addClass('Q_highlighted');
			$this.removeData('Q_contextual_id');
		});
	}
}

);

})(Q, jQuery, window, document);