(function ($, window, document, undefined) {

/*
 * Makes the Q clickable effect (which I first came up with at Intermagix)
 */
Q.Tool.jQuery('Q/clickable',

function (o) {
	
	$(this).on('invoke.Q_clickable', function () {
		$(this).trigger('mousedown');
		setTimeout(function () {
			$(this).trigger('release')
		}, o.press.duration);
	});
	$(this).each(function () {
		var $this = $(this);
		if ($this.data('Q/clickable')) {
			return;
		}
        if (!o.selectable) {
			this.onselectstart = function() { return false; }; 
	        this.unselectable = "on"; 
	        $this.css('-moz-user-select', 'none'); 
	        $this.css('-webkit-user-select', 'none');
			$this.css('-ms-user-select', 'none');
			$this.css('user-select', 'none');
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
				$this.css({
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
				});
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
		}).data('Q/clickable', true);
		var zindex;
		var anim = null;
		stretcher.on('dragstart', function () {
			return false;
		}).on(Q.Pointer.start, function (evt) {
			if (Q.info.isTouchscreen) {
				evt.preventDefault();
			}
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
			Q.Pointer.onCancelClick.set(function () {
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
					jq = $(document.elementFromPoint(
						x-$(window).scrollLeft(), 
						y-$(window).scrollTop()
					));
				}
				var overElement = !Q.Pointer.canceledClick && (jq.closest(stretcher).length > 0);
				if (overElement) {
					var factor = scale.factor;
					anim = Q.Animation.play(function(x, y) {
						scale(factor + y * (o.release.size-o.press.size));
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
						scale(o.press.size + y * (1-o.press.size));
						$this.css('opacity', o.press.opacity + y * (1-o.press.opacity));
						if (x === 1) {
							$this.off('click.Q_clickable');
						}
					}, o.release.duration, o.release.ease);
					setTimeout(function () {
						Q.handle(o.afterRelease, $this, [evt, overElement]);
						$this.trigger('afterRelease', $this, evt, overElement);
						container.css('z-index', zindex);
					}, o.release.duration);
				}
				$(window).off([Q.Pointer.end, '.Q_clickable']);
				$(window).off('release.Q_clickable');
				Q.handle($this.state('Q/clickable').onRelease, $this, [evt, overElement]);
			};
			function scale(factor) {
				scale.factor = factor;
				if (!$.browser.msie) {
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
});

})(jQuery, window, document);