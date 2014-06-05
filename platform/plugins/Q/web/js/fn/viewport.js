(function (Q, $, window, document, undefined) {

Q.Tool.jQuery('Q/viewport',

function (options) {
	var container, stretcher;
	var position = this.css('position');
	var display = this.css('display');
	
	this.state('Q/viewport').oldCursor = this.css('cursor');
	this.css('cursor', 'move');
	
	container = $('<span class="Q_clickable_container" />').css({
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
		'width': this.outerWidth(true),
		'height': this.outerHeight(true),
		'text-align': 'left',
		'overflow': 'hidden',
		'line-height': this.css('line-height'),
		'vertical-align': this.css('vertical-align'),
		'text-align': this.css('text-align')
	}).addClass('Q_clickable_container')
	.insertAfter(this);
	
	stretcher = $('<div />').css({
		'position': 'absolute',
		'left': '0px',
		'top': '0px',
		'width': container.width()+0.5+'px',
		'height': container.height()+0.5+'px',
		'overflow': 'visible',
		'padding': '0px',
		'margin': '0px'
	}).appendTo(container)
	.append(this);
	
	if (options.containerClass) {
		container.addClass(options.containerClass);
	}
	
	scale.factor = 1;
	container.on(Q.Pointer.wheel, function (e) {
		if (typeof e.deltaY === 'number' && !isNaN(e.deltaY)) {
			scale(Math.max(1, scale.factor - e.deltaY * 0.01), Q.Pointer.getX(e), Q.Pointer.getY(e));
		}
		return false;
	});
	
	var start = null;
	var cur = null;
	var pos = null;
	container.on('dragstart', function () {
		return false;
	}).on(Q.Pointer.start, function (e) {
		if (Q.Pointer.canceledClick) return;
		start = {
			x: Q.Pointer.getX(e),
			y: Q.Pointer.getY(e)
		};
		var $t = $(this);
		pos = {
			left: parseInt($t.css('left')),
			top: parseInt($t.css('top'))
		};
	}).on(Q.Pointer.move, function (e) {
		if (!pos) return;
		if (Q.Pointer.which(e) !== Q.Pointer.which.LEFT) return;
		var x = Q.Pointer.getX(e);
		var y = Q.Pointer.getY(e);
		var nl = Math.min(0, pos.left + x - start.x);
		var nt = Math.min(0, pos.top + y - start.y);
		cur = {
			x: x-parseInt(stretcher.css('left')),
			y: y-parseInt(stretcher.css('top'))
		};
		stretcher.css({ left: nl, top: nt });
		return false;
	}).on(Q.Pointer.end, function (e) {
		start = pos = null;
	});
	
	function scale(zoom, mouseX, mouseY) {
        console.log(zoom, mouseX, mouseY);
        var zoomObj = stretcher.children();
        var Z = zoom/scale.factor;

        if (!Q.info.isIE(0, 8)) {
            var containerOffset = zoomObj.offset();
            var mouseRel = {
                x: mouseX - containerOffset.left,
                y: mouseY - containerOffset.top
            };
            var dimension = {
                width: zoomObj.width() * Z,
                height: zoomObj.height() * Z
            };

            var translate = {
                left: containerOffset.left + (mouseRel.x - dimension.width * mouseRel.x/zoomObj.width() ),
                top: containerOffset.top + (mouseRel.y - dimension.height * mouseRel.y/zoomObj.height() )
            };
            var css = {
                'transform-origin': '0% 0%'
            };
            for (var k in css) {
                css[Q.info.browser.prefix+k] = css[k];
            }
            zoomObj.css(css);
            zoomObj.width(dimension.width);
            zoomObj.height(dimension.height);
            zoomObj.offset({top: translate.top,  left: translate.left });

            scale.factor = zoom;

		}
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