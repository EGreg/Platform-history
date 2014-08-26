(function (Q, $, window, document, undefined) {

/**
 * Q Tools
 * @module Q-tools
 */

/**
 * Makes an element clickable, creating cool "popping" effect when you press it,
 * which especially looks nice on touchscreens.
 * I originally came up with this effect at Intermagix.
 * @class Q clickable
 * @constructor
 * @param {Object} [options] options for function configuration
 * @param {Object} [options.shadow] shadow effect configuration
 * @param {String} [options.shadow.src] src , path to image for shadow
 * @default "plugins/Q/img/shadow3d.png"
 * @param {Number} [options.shadow.stretch] stretch
 * @default 1.5
 * @param {Number} [options.shadow.dip] dip
 * @default 0.25
 * @param {Number} [options.shadow.opacity] opacity
 * @default 0.5
 * @param {Object} [options.press] press
 * @param {Number} [options.press.duration] duration
 * @default 100
 * @param {Number} [options.press.size] size
 * @default 0.85
 * @param {Number} [options.press.opacity] opacity
 * @default 1
 * @param {Q.Animation.ease} [option.press.ease] ease
 * @default Q.Animation.ease.linear
 * @param {Object} [options.release] release
 * @param {Number} [options.release.duration] duration
 * @default 75
 * @param {Number} [options.release.size] size
 * @default 1.3
 * @param {Number} [options.release.opacity] opacity
 * @default 0.5
 * @param {Q.Animation.ease} [options.release.ease] ease
 * @default Q.Animation.ease.smooth
 * @param {Object} [options.snapback] snapback
 * @param {Number} [options.snapback.duration] duration
 * @default 75
 * @param {Q.Animation.ease} [options.snapback.ease]
 * @default Q.Animation.ease.smooth
 * @param {Object} [options.center] center
 * @param {Number} [options.center.x] x
 * @default 0.5
 * @param {Number} [options.center.y] y
 * @default 0.5
 * @param {Boolean} [options.selectable]
 * @default false
 * @param {Boolean} [options.triggers] A jquery selector or jquery of additional elements to trigger the clickable
 * @default null
 * @param {Event} [options.onPress] onPress
 * @default new Q.Event()
 * @param {Event} [options.onRelease] onRelease
 * @default new Q.Event()
 * @param {Event} [options.afterRelease] afterRelease
 * @default new Q.Event()
 * @param {Number} [options.cancelDistance] cancelDistance
 * @default 15
 *
 */
Q.Tool.jQuery('Q/clickable',

function (o) {
	
	var $this = $(this);
	var state = $this.state('Q/clickable');
	$this.on('invoke.Q_clickable', function () {
		$(this).trigger('mousedown');
		setTimeout(function () {
			$(this).trigger('release')
		}, o.press.duration);
	});
	state.oldStyle = $this.attr('style');
    if (!o.selectable) {
		this.onselectstart = function() { return false; }; 
        this.unselectable = "on";
		var prop = Q.info.browser.prefix+'user-select';
		$this.css(prop, 'none');
	}
	var $triggers;
	if (o.triggers) {
		$triggers = (typeof o.triggers === 'function')
			? $(o.triggers.call($this, o))
			: $(o.triggers);
	}
	var position = $this.css('position');
	var display = $this.css('display');
	var p = $this.parent();
	if (p.length && p[0].tagName.toUpperCase() === 'TD') {
		p.css('position', 'relative');
	}
	var h = $this.css('height');
	// $this.css('height', $this.height()+'px');
	var container = $('<span class="Q_clickable_container" />').css({
		'display': (display === 'inline' || display === 'inline-block') ? 'inline-block' : display,
		'zoom': 1,
		'position': position === 'static' ? 'relative' : position,
		'left': position === 'static' ? 0 : $this.position().left,
		'top': position === 'static' ? 0 : $this.position().top,
		'margin': '0px',
		'padding': '0px',
		'border': '0px solid transparent',
		'float': $this.css('float'),
		// 'z-index': $this.css('z-index') + 1, //10000,
		'overflow': 'hidden',
		'width': $this.outerWidth(true),
		'height': $this.outerHeight(true),
		'text-align': 'left',
		'overflow': 'visible',
		'line-height': $this.css('line-height'),
		'vertical-align': $this.css('vertical-align'),
		'text-align': $this.css('text-align')
	}).addClass('Q_clickable_container')
	.insertAfter($this);
	// $this.css('height', h);
	if (display === 'inline') {
		container.html('&nbsp;');
	}
	if (o.shadow && o.shadow.src) {
		var shadow = $('<img />').addClass('Q_clickable_shadow')
			.attr('src', Q.url(o.shadow.src));
		shadow.css('display', 'none').appendTo(container).load(function () {
			var $this = $(this);
			var width = container.width() * o.shadow.stretch;
			var height = Math.min($this.height() * width / $this.width(), container.height()/2);
			var toSet = {
				'position': 'absolute',
				'left': (container.width() - width)/2+'px',
				'top': container.height() - height * (1-o.shadow.dip)+'px',
				'width': width+'px',
				'height': height+'px',
				'opacity': o.shadow.opacity,
				'display': '',
				'padding': '0px',
				'background': 'none',
				'border': '0px',
				'outline': '0px'
			};
			var i, l, props = Object.keys(toSet);
			$this.css(toSet);
		});
	}
	var stretcher = $('<div />').css({
		'position': 'absolute',
		'left': '0px',
		'top': '0px',
		'width': container.width()+0.5+'px',
		'height': container.height()+0.5+'px',
		'overflow': 'visible',
		'padding': '0px',
		'margin': '0px'
	}).appendTo(container);
	var triggers = stretcher;
	var width = container.width();
	var height = container.height();
	var left = parseInt(container.css('left'));
	var top = parseInt(container.css('top'));
	var tw = $this.outerWidth();
	var th = $this.outerHeight();
	$this.appendTo(stretcher).css({
		'position': 'absolute',
		'left': '0px',
		'top': '0px'
	});
	var zindex;
	var anim = null;
	
	triggers = stretcher;
	if ($triggers && $triggers.length) {
		if (!Q.info.isTouchscreen) {
			$triggers.mouseenter(
				function () { container.addClass('Q_hover'); }
			).mouseleave(
				function () { container.removeClass('Q_hover'); }
			);
		}
		triggers = triggers.add($triggers);
	}
	
	triggers.on('dragstart', function () {
		return false;
	}).on(Q.Pointer.start, function (evt) {
		// if (Q.info.isTouchscreen) {
		// 	evt.preventDefault();
		// }
		if (Q.Pointer.canceledClick
		|| $('.Q_discouragePointerEvents', evt.target).length) {
			return;
		}
		triggers[0].preventSelections();
		$('body')[0].preventSelections();
		zindex = $this.css('z-index');
		container.css('z-index', 1000000);
		Q.handle(o.onPress, $this, [evt]);
		Q.Animation.play(function(x, y) {
			scale(1 + y * (o.press.size-1));
			$this.css('opacity', 1 + y * (o.press.opacity-1));
		}, o.press.duration, o.press.ease);
		//$this.bind('click.Q_clickable', function () {
		//	return false;
		//});
		var pos = null;
		Q.Pointer.onCancelClick.set(function (e, extraInfo) {
			var jq = $(document.elementFromPoint(
				extraInfo.toX, 
				extraInfo.toY
			));
			var overElement = (jq.closest(triggers).length > 0);
			if (overElement) {
				return false;
			}
			anim && anim.pause();
			scale(1);
		}, 'Q/clickable');
		$(window).on([Q.Pointer.end, '.Q_clickable'], onRelease);
		$(window).on('release.Q_clickable', onRelease);
		function onRelease (evt) {
			var jq;
			if (evt.type === 'release') {
				jq = $this;
			} else {
				var x = (evt.pageX !== undefined) ? evt.pageX : evt.originalEvent.changedTouches[0].pageX,
					y = (evt.pageY !== undefined) ? evt.pageY : evt.originalEvent.changedTouches[0].pageY;
				jq = $(Q.Pointer.elementFromPoint(x, y));
			}
			var overElement = !Q.Pointer.canceledClick 
				&& (jq.closest(triggers).length > 0);
			var factor = scale.factor;
			if (overElement) {
				anim = Q.Animation.play(function(x, y) {
					scale(factor + y * (o.release.size-factor));
					$this.css('opacity', o.press.opacity + y * (o.release.opacity-o.press.opacity));
					if (x === 1) {
						Q.Animation.play(function(x, y) {
							scale(o.release.size + y * (1-o.release.size));
							$this.css('opacity', 1 + y * (1 - o.release.opacity));
							if (x === 1) {
								Q.handle(o.afterRelease, $this, [evt, overElement]);
								$this.trigger('afterRelease', $this, evt, overElement);
								container.css('z-index', zindex);
								// $this.unbind('click.Q_clickable');
								// $this.trigger('click');
							}
						}, o.snapback.duration, o.snapback.ease);
					}
				}, o.release.duration, o.release.ease);
			} else {
				anim = Q.Animation.play(function(x, y) {
					scale(factor + y * (1-factor));
					$this.css('opacity', o.press.opacity + y * (1-o.press.opacity));
					// if (x === 1) {
					// 	$this.off('click.Q_clickable');
					// }
				}, o.release.duration, o.release.ease);
				setTimeout(function () {
					Q.handle(o.afterRelease, $this, [evt, overElement]);
					$this.trigger('afterRelease', $this, evt, overElement);
					container.css('z-index', zindex);
				}, o.release.duration);
			}
			
			triggers[0].restoreSelections();
			$('body')[0].restoreSelections();
			
			$(window).off([Q.Pointer.end, '.Q_clickable']);
			$(window).off('release.Q_clickable');
			Q.handle($this.state('Q/clickable').onRelease, $this, [evt, overElement]);
		};
		function scale(factor) {
			scale.factor = factor;
			if (!Q.info.isIE(0, 8)) {
				stretcher.css({
					'-moz-transform': 'scale('+factor+')',
					'-webkit-transform': 'scale('+factor+')',
					'-o-transform': 'scale('+factor+')',
					'-ms-transform': 'scale('+factor+')',
					'transform': 'scale('+factor+')'
				});
			} else if (!scale.started) {
				scale.started = true;
				stretcher.css({
					left: width * (o.center.x - factor/2) * factor +'px',
					top: height * (o.center.y - factor/2) * factor +'px',
					zoom: factor
				});
				scale.started = false;
			}
		}
	});
	return this;
},

{	// default options
	shadow: {
		src: "plugins/Q/img/shadow3d.png",
		stretch: 1.5,
		dip: 0.25,
		opacity: 0.5
	},
	press: {
		duration: 100,
		size: 0.85,
		opacity: 1,
		ease: Q.Animation.ease.linear
	},
	release: {
		duration: 75,
		size: 1.3,
		opacity: 0.5,
		ease: Q.Animation.ease.smooth
	},
	snapback: {
		duration: 75,
		ease: Q.Animation.ease.smooth
	},
	center: {
		x: 0.5,
		y: 0.5
	},
	selectable: false,
	onPress: new Q.Event(),
	onRelease: new Q.Event(),
	afterRelease: new Q.Event(),
	cancelDistance: 15
},

{
	remove: function () {
		var container = this.parent().parent();
		this.attr('style', this.state('Q/clickable').oldStyle || "")
		.insertAfter(container);
		container.remove();
	}
}

);

})(Q, jQuery, window, document);