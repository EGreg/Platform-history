(function (Q, $, window, document, undefined) {

/**
 * Q Tools
 * @module Q-tools
 */

/**
 * jQuery plugin that creates scalable and draggable element content or wraps that element.
 * Using this plugin you can move content of element inside element and make a zoom of element content with mouse wheel
 * @class Q viewport
 * @constructor
 * @param {Object} [options] this object contains function parameters
 *   @param {String} [options.containerClass] any class names to add to the actions container
 *   @default ''
 *   @param {Boolean} [options.wrap] Make element wrap or not
 *   @default false
 *   @param {Object} [options.initial] start position of content inside element
 *     @param {Number} [options.initial.left] left position
 *     @default 0
 *     @param {Number} [options.initial.top] top position
 *     @default 0
 *     @param {Number} [options.initial.width]
 *     @default 0
 *     @param {Number} [options.initial.height]
 *     @default 0
 *   @param {Object} [options.result]
 *   @param {Q.Event} [options.onRelease] This event triggering after viewport creation
 *   @default Q.Event()
 *   @param {Q.Event} [options.onZoom] This event triggering after zooming
 *   @default Q.Event()
 *   @param {Q.Event} [options.onMove] This event triggering after element move
 *   @default Q.Event()
 */
Q.Tool.jQuery('Q/viewport',

function _Q_viewport(options) {
	var container, stretcher;
	var position = this.css('position');
	var display = this.css('display');
	var state = this.addClass('Q_viewport').state('Q/viewport');

	state.oldCursor = this.css('cursor');
	this.css('cursor', 'move');

	if ( this.parent('.Q_viewport_stretcher').length ) {
        stretcher = this.parent();
        container = stretcher.parent();
    } else {
		container = $('<span class="Q_viewport_container" />').css({
			'display': (display === 'inline' || display === 'inline-block') ? 'inline-block' : display,
			'zoom': 1,
			'position': position === 'static' ? 'relative' : position,
			'left': position === 'static' ? 0 : this.position().left,
			'top': position === 'static' ? 0 : this.position().top,
			'margin': '0px',
			'padding': '0px',
			'border': '0px solid transparent',
			'float': this.css('float'),
			'z-index': this.css('z-index'),
			'overflow': 'hidden',
			'width':  options.initial.width ? options.initial.width : this.outerWidth(true),
			'height': options.initial.height ? options.initial.height : this.outerHeight(true),
			'text-align': 'left',
			'overflow': 'hidden',
			'line-height': this.css('line-height'),
			'vertical-align': this.css('vertical-align'),
			'text-align': this.css('text-align')
		}).addClass('Q_viewport_container ' + (options.containerClass || ''))
		.insertAfter(this);
		
		stretcher = $('<div class="Q_viewport_stretcher" />')
		.appendTo(container)
		.append(this);
	}
	
	stretcher.css({
		'position': 'absolute',
		'left': '0px',
		'top': '0px',
		'width': container.width()+0.5+'px',
		'height': container.height()+0.5+'px',
		'overflow': 'visible',
		'padding': '0px',
		'margin': '0px'
	});
	
	var useZoom = Q.info.isIE(0, 8);
	scale.factor = 1;
	var offset = stretcher.offset();
    fixPosition({
        left: offset.left,
        top: offset.top,
        zoom: 1
    });
	
	var grab = null;
	var cur = null;
	var pos = null;
	container.on('dragstart', function () {
		return false;
	}).on(Q.Pointer.start, function (e) {
		
		var f = useZoom ? scale.factor : 1;
		var touches = e.originalEvent.touches;
		var touchDistance;
		if (touches && touches.length > 1) {
			touchDistance = Math.sqrt(
				Math.pow(touches[1].pageX - touches[0].pageX, 2) +
				Math.pow(touches[1].pageY - touches[0].pageY, 2)
			);
		}
		
		function _moveHandler (e) {
			var offset, touches;
			offset = stretcher.offset();
			cur = {
				x: Q.Pointer.getX(e),
				y: Q.Pointer.getY(e)
			};
			if (!pos) return;
			if (Q.info.isTouchscreen && (touches = e.originalEvent.touches)) {
				if (touches.length > 1) {
					var newDistance = Math.sqrt(
						Math.pow(touches[1].pageX - touches[0].pageX, 2) +
						Math.pow(touches[1].pageY - touches[0].pageY, 2)
					);
					var factor = scale.factor * newDistance / touchDistance;
					if (factor >= 1) {
						scale(factor, Q.Pointer.getX(e), Q.Pointer.getY(e));
						touchDistance = newDistance;
					}
				}
			} else if (Q.Pointer.which(e) !== Q.Pointer.which.LEFT) {
				return;
			}
			var x = Q.Pointer.getX(e);
			var y = Q.Pointer.getY(e);
			var newPos = {
				left: pos.left + (x - grab.x)/f,
				top: pos.top + (y - grab.y)/f
			};
			fixPosition(newPos);
			stretcher.css(newPos);
			Q.Pointer.cancelClick(); // on even the slightest move
		}
		
		function _endHandler (e) {
			start = pos = null;
			container.off(Q.Pointer.move);
			$(window).off(Q.Pointer.end, _endHandler);
			$(window).off(Q.Pointer.clickHandler, _clickHandler);
			e.preventDefault();
		}
		
		function _cancelHandler (e) {
			$(window).off(Q.Pointer.end, _endHandler);
			$(window).off(Q.Pointer.clickHandler, _clickHandler);
		}
		
		function _clickHandler (e) {
			$(window).off(Q.Pointer.clickHandler, _clickHandler);
			e.preventDefault();
		}
		
		if (Q.Pointer.canceledClick) {
			return;
		}
		grab = cur = {
			x: Q.Pointer.getX(e),
			y: Q.Pointer.getY(e)
		};
		pos = {
			left: parseInt(stretcher.css('left')),
			top: parseInt(stretcher.css('top'))
		};
		container.on(Q.Pointer.move, _moveHandler);
		$(window).on(Q.Pointer.end, _endHandler);
		$(window).on(Q.Pointer.cancel, _cancelHandler);
		$(window).on(Q.Pointer.click, _clickHandler);
	});
	
	scale.factor = 1;
	container.on(Q.Pointer.wheel, function (e) {
		if (typeof e.deltaY === 'number' && !isNaN(e.deltaY)) {
			scale(
				Math.max(1, scale.factor - e.deltaY * 0.01),
				Q.Pointer.getX(e),
				Q.Pointer.getY(e)
			);
		}
		return false;
	});
	
	state.result = {
        left: -offset.left / scale.factor,
        top: -offset.top / scale.factor,
        width: container.width() / scale.factor,
        height: container.height() / scale.factor
    };
	
	function scale(factor, x, y) {
		var left1, left2, left3, top1, top2, top3, offset, css;
		var offset = stretcher.offset();
		var f = useZoom ? scale.factor : 1;
		left1 = parseInt(stretcher.css('left')) * f;
		top1 = parseInt(stretcher.css('top')) * f;
		left1 -= (x - offset.left) * (factor / scale.factor - 1);
		top1 -= (y - offset.top) * (factor / scale.factor - 1);
		if (!useZoom) {
			css = { 
				left: left1,
				top: top1,
				transform: 'scale('+factor+')',
				transformOrigin: '0% 0%'
			};
			fixPosition(css);
			for (var k in css) {
				css[Q.info.browser.prefix+k] = css[k];
			}
			stretcher.css(css);
		} else if (!scale.inProgress) {
			scale.inProgress = true;
			css = {
				left: left1 / factor,
				top: top1 / factor,
				zoom: factor
			};
			fixPosition(css);
			stretcher.css(css);
			scale.inProgress = false;
		}
		scale.factor = factor;
	}
	
	function fixPosition(pos) {
		var f = useZoom ? scale.factor : 1;
		var w = -(stretcher.width()*scale.factor - container.width())/f;
		var h = -(stretcher.height()*scale.factor - container.height())/f;
		pos.left = Math.min(0, Math.max(pos.left, w+1)) + 'px';
		pos.top = Math.min(0, Math.max(pos.top, h+1)) + 'px';
	}
},

{	// default options:
	containerClass: '', // any class names to add to the actions container
	wrap: false,
	initial: { left: 0, top: 0, width: 0, height: 0 },
	result: {},
	onRelease: new Q.Event(),
	onZoom: new Q.Event(),
	onMove: new Q.Event()
},

{
	remove: function () {
		this.css('cursor', this.state('Q/viewport').oldCursor);
	}
}

);

})(Q, jQuery, window, document);