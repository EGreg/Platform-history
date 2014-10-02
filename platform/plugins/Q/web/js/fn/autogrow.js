(function (Q, $, window, document, undefined) {

/**
 * Q Tools
 * @module Q-tools
 */

/**
 * Plugin that allows a textbox or textarea to grow to encompass its content as it changes
 * @class Q autogrow
 * @constructor
 * @param {Object} [options] , object for an options
 * @param {Number} [options.maxWidth] maxWidth , number for Maximum width, or reference to an Element
 * @default 1000
 * @param {Number} [options.minWidth] minWidth , number for Minimum width
 * @default 0
 * @param {Number} [options.comfortZone] comfortZone
 * @default 10
 * @param [Q.Event] [options.onResize] onResize , event that triggering on resize
 * @default new Q.Event()
 */

Q.Tool.jQuery('Q/autogrow',

function _Q_autogrow(o) {

	var possibleEvents = 'keyup.Q_autogrow'
		+ ' blur.Q_autogrow'
		+ ' update.Q_autogrow'
		+ ' paste.Q_autogrow'
		+ ' autogrowCheck';

	this.filter('textarea').each(function (i) {
		var $t = $(this), t = this;
		var val = '';

		t.style.resize = 'none';
		t.style.overflow = 'hidden';

		var tVal = t.value;			
		t.style.height = '0px';
		t.value = "W\nW\nW";
		var H3 = t.scrollHeight;
		t.value = "W\nW\nW\nW";
		var H4 = t.scrollHeight;
		var H = H4 - H3;
		t.value = tVal;
		tVal = null;

		++p.count;
		var $c = $t.parent();
		if (!$c.hasClass('Q_autogrow_container')) {
			$c = $('<div id="jQuery_fn_autogrow_'+p.count+'" class="Q_autogrow_container"></div>');
			$t.before($c);
			$t.appendTo($c);
		}
		var c = $c[0];
		c.style.padding = '0px';
		c.style.margin = '0px';

		$t.on('focus', function(){
			t.startUpdating()
		}).on('blur', function(){
			t.stopUpdating()
		});

		function updateHeight() {
			tVal = t.value;
			t.style.height = '0px';
			var tH = t.scrollHeight; // + H;
			t.style.height = tH + 'px';
			setTimeout(function () {
				c.style.height = t.offsetHeight + 'px';
			}, 0)
		};

		this.startUpdating = function() {
			$(this).off(possibleEvents).on(possibleEvents, updateHeight);
			t.timeout1 = setTimeout(updateHeight, 0);
			t.timeout2 = setTimeout(updateHeight, 100);
		};

		this.stopUpdating = function(){
			clearTimeout(t.timeout1);
			clearTimeout(t.timeout2);
		};
		
		updateHeight();
		Q.handle(o.onResize, this, []);
	});

	this.filter('input:text').each(function() {
		var minWidth = o.minWidth || 20,
			val = '',
			input = $(this),
			testSubject = $(this).data('Q-tester');
		if (!testSubject) {
			testSubject = $('<div class="Q_tester"/>');
			$(this).data('Q-tester', testSubject);
			testSubject.insertAfter(input);
		}
		function updateWidth() {
			val = input.val();
			if (!val) {
				val = input.attr('placeholder') || '';
			}

			// Enter new content into testSubject
			var escaped = val.encodeHTML();
			testSubject.css({
				position: 'absolute',
				top: -9999,
				left: -9999,
				width: 'auto',
				fontSize: input.css('fontSize'),
				fontFamily: input.css('fontFamily'),
				fontWeight: input.css('fontWeight'),
				letterSpacing: input.css('letterSpacing'),
				padding: input.css('padding'),
				margin: input.css('margin'),
				whiteSpace: 'nowrap'
			});
			testSubject.html(escaped);

			// Calculate new width + whether to change
			testSubject.show();
			var testerWidth = testSubject.outerWidth(true);
			testSubject.hide();
			var newWidth = Math.max(testerWidth + o.comfortZone, minWidth);
			var currentWidth = input.outerWidth(true);
			var maxWidth = (o.maxWidth instanceof Element)
				? $(o.maxWidth).innerWidth()
				: o.maxWidth;
			var isValidWidthChange = ((
				(newWidth < currentWidth && newWidth >= minWidth)
				|| (newWidth > minWidth)
			) && (!maxWidth || newWidth <= maxWidth));

			// Animate width
			if (isValidWidthChange) {
				input.width(newWidth);
				Q.handle(o.onResize, this, [newWidth]);
			} else if (input.width() < minWidth) {
				input.width(minWidth);
			}

		};

		$(this).off(possibleEvents).on(possibleEvents, updateWidth);
		updateWidth();

	});

	return this;

},

{	// default options:
	maxWidth: 1000,
	minWidth: 0,
	comfortZone: 10,
	onResize: new Q.Event()
}

);

var p = {
	count: 0
}

})(Q, jQuery, window, document);