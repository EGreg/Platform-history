(function (Q, $, window, document, undefined) {

/**
 * Activates placeholder effect on any input and textarea elements contained within this jquery.
 * Attribute placeholder must be set for element
 * @method placeholders
 * @param {Object} [options]
 */
Q.Tool.jQuery('Q/placeholders',

function () {
	
	$('input', this)
	.add($(this))
	.not('input.Q_leave_alone')
	.not('input[type=hidden]')
	.not('input[type=submit]')
	.add('textarea', this).each(function () {
		var t = this.tagName.toLowerCase();
		if (t != 'input' && t != 'textarea') return;
		
		var $this = $(this);
		
		var plch = $this.attr('placeholder');
		$this.removeAttr('placeholder');
		if(!(plch))
			return;

		var span = $('<span />').css('position', 'relative').addClass('Q_placeholder')
		$this.css({
			'width': $this.width(),
			'height': $this.height()
		}); // because they might have been percentages
		Q.each(['left', 'right', 'top', 'bottom'], function (i, pos) {
			$this.css('padding-'+pos, $this.css('padding-'+pos))
				.css('margin-'+pos, $this.css('margin-'+pos));
		});
		$this.wrap(span);
		span = $this.parent();
		span.width($this.outerWidth(true)).height($this.outerHeight(true));
		span.on(Q.Pointer.fastclick, function() {
			$this.trigger('focus');
			return false;
		});
		var placeholder = $('<div />').html(plch).css({
			'position': 'absolute',
			'left': $this.position().left,
			'top': $this.position().top,
			'margin-top': $this.css('margin-top'),
			'margin-left': $this.css('margin-left'),
			'padding-left': parseInt($this.css('padding-left'))+3+'px',
			'padding-top': $this.css('padding-top'),
			'border-top': 'solid ' + $this.css('border-top-width') + ' transparent',
			'border-left': 'solid ' + $this.css('border-left-width') + ' transparent',
			'font-size': $this.css('font-size'),
			'font-weight': $this.css('font-weight'),
			'line-height': $this.css('line-height'),
			'overflow': 'hidden',
			'width': $this.css('width'),
			'height': $this.css('height'),
			'text-align': $this.css('text-align')
		}).addClass('Q_placeholder').insertAfter($this);
		// IE8 workaround
		placeholder[0].style.fontFamily = $this[0].style.fontFamily;
		if ($this.val()) {
			placeholder.stop().hide();
		}
		var interval;
		$this.focus(function () {
			placeholder.parent().addClass('Q_focus');
		});
		$this.blur(function () {
			placeholder.parent().removeClass('Q_focus');
			if (interval) clearInterval(interval);
		});
		$this.data('Q-placeholder', placeholder);
	});
	if (!p.attachedLive) {
		$('input').on('keypress keyup change input focus blur Q_refresh', manage);
		$('textarea').on('keypress keyup change input focus blur Q_refresh', manage);
		p.attachedLive = true;
	}
	return this;

	function manage(event) {
		var $this = $(this);
		var placeholder = $this.data('Q-placeholder');
		if (!placeholder) {
			return;
		}
		if ($this.val()) { //  || event.type === 'keypress' || event.type === 'change'
			placeholder.hide();
		} else {
			placeholder.show();
		}
	}
});

var p = {};

})(Q, jQuery, window, document);