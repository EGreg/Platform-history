(function (Q, $, window, document, undefined) {

/**
 * Q Tools
 * @module Q-tools
 */

/**
 * Adjusts the font size of the context text until it fills the element's width and height
 * @class Q textfill
 * @constructor
 * @param {Object} [options] options object that contains function parameters
 *   @param {Number} [options.maxFontPixels] Maximum size of text font,
 *   set this if your text container is large and you don't want to have extra large text on page
 *   @param {Number} [options.maxLines] Maximum number of lines,
 *   set this if you'd like to have a maximum number of lines.
 *   @default null
 */
Q.Tool.jQuery('Q/textfill',

    function _Q_textfill(options) {

        return $(this).plugin("Q/textfill", 'refresh', options);

    },

    {},

    {
        refresh: function (options) {
			var o = Q.extend({}, this.state('Q/textfill'), options);
            var ourElement, ourText = "";
            $('*:visible', this).each(function () {
                var $t = $(this);
                if (!$t.children().length && $t.text().length > ourText.length) {
                    ourElement = $t;
                    ourText = $t.text();
                }
            });
			if (!ourElement) throw new Q.Error("Q/textfill missing a visible element");
            var fontSize = o.maxFontPixels || (ourElement.height() + 10);
            var maxHeight = $(this).innerHeight();
            var maxWidth = $(this).innerWidth();
            var textHeight;
            var textWidth;
			var lines;
            do {
                ourElement.css('font-size', fontSize);
                textHeight = ourElement.outerHeight(true);
                textWidth = ourElement.outerWidth(true);
				if (o.maxLines) {
					lines = textHeight / Math.floor(parseInt(fontSize.toString().replace('px','')) * 1.5);
				}
            } while (--fontSize > 3
				&& (
					textHeight > maxHeight || textWidth > maxWidth
					|| (o.maxLines && lines > o.maxLines)
				)
			);
            return this;
        }
    }

);

})(Q, jQuery, window, document);