(function ($, window, document, undefined) {

/*
 * Activates placeholder effect on any input and textarea elements contained within this jquery
 */
Q.Tool.jQuery('Q/textfill',

function (options) {

	return $(this).plugin("Q/textfill", 'refresh', options);

}, 

{},

{
	refresh: function (options) {
		options = options || {};
		var ourElement, ourText = "";
		$('*:visible', this).each(function () {
			var $t = $(this);
			if (!$t.children().length && $t.text().length > ourText.length) {
				ourElement = $t;
				ourText = $t.text();
			}
		});
		var fontSize = options.maxFontPixels || (ourElement.height() + 10);
		var maxHeight = $(this).innerHeight();
		var maxWidth = $(this).innerWidth();
		var textHeight;
		var textWidth;
		do {
		    ourElement.css('font-size', fontSize);
		    textHeight = ourElement.outerHeight(true);
		    textWidth = ourElement.outerWidth(true);
		    fontSize = fontSize - 1;
		} while ((textHeight > maxHeight || textWidth > maxWidth) && fontSize > 3);
		return this;
	}
}

);

})(window.jQuery, window, document);