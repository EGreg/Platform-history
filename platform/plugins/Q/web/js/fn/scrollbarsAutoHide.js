(function (Q, $, window, document, undefined) {

/**
 * Q Tools
 * @module Q-tools
 */

/**
 * jQuery plugin for automatically hiding scrollbars
 * on 'overflow: scroll' or 'overflow: auto' elements when
 * mouse cursor is not over them.
 * Usable on desktop browsers for not overloading interface
 * with unneeded visual elements (such as scrollbars)
 * if there are lot of scrollable areas.
 * @class Q scrollbarsAutoHide
 * @constructor
 * @param {Mixed} [Object_or_String] function could have String or Object parameter
 * @param {Object} [Object_or_String.Object] If an object then it's a hash of options, that can include:
 *   @param {Boolean} [Object_or_String.Object.scrollbarPadding] Boolean which indicates whether to preserve padding in a container based on scrollbar
 *   width. Padding preserved on the right side (for vertical scrolling) or on the bottom side (for horizontal scrolling).
 *	 @default true
 *	 @param {Q.Event} [Object_or_String.Object.showHandler] callback which is called when scrollbar is just shown.
 *	 @param {Q.Event} [Object_or_String.Object.hideHandler] callback which is called when scrollbar is just hidden.
 * @param {String} [Object_or_String.String]
 *	 If a string then it's a command and it can have following values:
 *	 "destroy": Destroys the plugin functionality so the container won't hide its scrollbars automatically anymore.
 */

    Q.Tool.jQuery('Q/scrollbarsAutoHide',

        function (o) {

            return this.each(function () {
                var $this = $(this);
                if (this.scrollHeight <= this.offsetHeight
                    && this.scrollWidth <= this.offsetWidth) {
                    return;
                }
                var scrollbarWidth = Q.Browser.getScrollbarWidth();
                var oldOverflow = $this.css('overflow');
                var oldPaddingRight = parseInt($this.css('padding-right'));
                var oldPaddingBottom = parseInt($this.css('padding-bottom'));
                $this.data('Q_old_overflow', oldOverflow);
                $this.data('Q_old_padding_right', oldPaddingRight);
                $this.data('Q_old_padding_bottom', oldPaddingBottom);
                var scrollbarRight = this.scrollHeight > this.offsetHeight;
                var scrollbarBottom = this.scrollWidth > this.offsetWidth;
                var paddingDiff =  0;
                if (scrollbarRight) {
                    $this.css('overflow', 'hidden' );
                    if (o.scrollbarPadding) {
                        $this.css('padding-right', (oldPaddingRight + scrollbarWidth) + 'px');
                    } else {
                        paddingDiff = oldPaddingRight - scrollbarWidth;
                        if (paddingDiff < 0) paddingDiff = 0;
                        $this.css('padding-right', paddingDiff + 'px');
                    }
                    $this.on({
                        'mouseenter.Q_scrollbar_autohide': function() {
                            $this.css({ 'overflow': 'auto' });
                            if (o.scrollbarPadding) {
                                $this.css({ 'padding-right': oldPaddingRight + 'px' });
                            } else {
                                $this.css({ 'padding-right': paddingDiff + 'px' });
                            }
                            if (Q.Browser.detect().OS == 'mac') {
                                var scrollTop = $this.scrollTop();
                                $this.scrollTop(0);
                                $this.scrollTop(scrollTop);
                            }
                            Q.handle(o.showHandler);
                        },
                        'mouseleave.Q_scrollbar_autohide': function() {
                            $this.css({ 'overflow': 'hidden' });
                            if (o.scrollbarPadding) {
                                $this.css({ 'padding-right': (oldPaddingRight + scrollbarWidth) + 'px' });
                            } else {
                                $this.css({ 'padding-right': Math.max(oldPaddingRight, scrollbarWidth) + 'px' });
                            }
                            Q.handle(o.hideHandler);
                        }
                    });
                } else if (scrollbarBottom) {
                    $this.css({ 'overflow': 'hidden' });
                    if (o.scrollbarPadding) {
                        $this.css({ 'padding-bottom': (oldPaddingBottom + scrollbarWidth) + 'px' });
                    }
                    $this.on({
                        'mouseenter.Q_scrollbar_autohide': function() {
                            $this.css({ 'overflow': 'auto' });
                            if (o.scrollbarPadding) {
                                $this.css({ 'padding-bottom': oldPaddingBottom + 'px' });
                            }
                            if (Q.Browser.detect().OS == 'mac') {
                                var scrollLeft = $this.scrollLeft();
                                $this.scrollLeft(0);
                                $this.scrollLeft($this.data('Q_latest_scroll_left'));
                            }
                            Q.handle(o.showHandler);
                        },
                        'mouseleave.Q_scrollbar_autohide': function() {
                            $this.css({ 'overflow': 'hidden' });
                            if (o.scrollbarPadding) {
                                $this.css({ 'padding-bottom': (oldPaddingBottom + scrollbarWidth) + 'px' });
                            }
                            Q.handle(o.hideHandler);
                        }
                    });
                }

                $this.on('mousemove.Q_scrollbar_autohide', function() {
                    $this.off('mousemove.Q_scrollbar_autohide').trigger('mouseenter');
                });
            });
        },

        {
            'scrollbarPadding': true,
            'showHandler': new Q.Event(function() {}),
            'hideHandler': new Q.Event(function() {})
        },

        {
			/**
			 * Removes the scrollbarsAutoHide functionality from the element
			 * @method remove
			 */
            remove: function () {
                this.each(function(index) {
                    var $this = $(this);
                    if ($this.data('Q_old_overflow') !== undefined)
                    {
                        $this.off('mouseenter.Q_scrollbar_autohide mouseleave.Q_scrollbar_autohide mousemove.Q_scrollbar_autohide');
                        $this.css({
                            'overflow': $this.data('Q_old_overflow'),
                            'padding-right': $this.data('Q_old_padding_right') + 'px',
                            'padding-bottom': $this.data('Q_old_padding_bottom') + 'px'
                        });
                        $this.removeData(['Q_old_overflow', 'Q_old_padding_right', 'Q_old_padding_bottom']);
                    }
                });
            }
        }

    );

})(Q, jQuery, window, document);