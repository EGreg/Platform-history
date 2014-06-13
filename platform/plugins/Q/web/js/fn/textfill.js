(function (Q, $, window, document, undefined) {

    /**
     * Brings Element content text to the maximum size inside element, by changing font size until it will be closer
     * to element Width or Height
     * @method textfill
     * @param {Object} [options] options object that contains function parameters
     *   @param {Number} [options.maxFontPixels] Maximum size of text font , set this if your text container is large
     *   and you don't want to have extra large text on page
     *   @default null
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

})(Q, jQuery, window, document);