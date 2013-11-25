(function ($, window, document, undefined) {

Q.Tool.jQuery('Q/sortable',

function (options) {

	var $this = $(this);
	var dataLifted = 'Q/sortable dragging', mx, my, gx, gy, tLift, tScroll, iScroll, lifted, pressed;
	var $scrolling = null, ost = null, osl = null;
	
	$(document).on('keydown.Q_sortable', function (e) {
		if (lifted && e.keyCode == 27) { // escape key
			complete(true);
			return false;
		}
	});
	
	options.draggable = options.draggable || '*';
	$this.on(Q.Pointer.start+'.Q_sortable', options.draggable, liftHandler);
	
	$('*', $this).css('-webkit-touch-callout', 'none');
	$this.on('dragstart.Q_sortable', options.draggable, function () {
		var state = $this.state('Q/sortable');
		if (state.draggable === '*' && this.parentNode !== $this[0]) {
			return;
		}
		return false;
	});

	function liftHandler(event) {	
		if (Q.Pointer.which(event) > 1) {
			return; // only left mouse button or touches
		}
		pressed = true;
		var state = $this.state('Q/sortable');
		if (state.draggable === '*' && this.parentNode !== $this[0]) {
			return;
		}
		var $item = $(this);
		this.preventSelections();
		Q.addEventListener(document, [Q.Pointer.cancel, Q.Pointer.leave], function leaveHandler() {
			Q.removeEventListener(document, [Q.Pointer.cancel, Q.Pointer.leave], leaveHandler);
			complete(true);
		});
		mx = Q.Pointer.getX(event);
		my = Q.Pointer.getY(event);
		var element = this;
		var sl = [], st = [];
		$(document).data(dataLifted, $(this))
			.on(Q.Pointer.move, moveHandler)
			.on(Q.Pointer.end, dropHandler)
			.on('click', clickHandler);
		$item.on(Q.Pointer.move, moveHandler)
			.on(Q.Pointer.end, dropHandler)
			.on('click', clickHandler) // return false in this handler prevents firing a second time for document
			.parents().each(function () {
				sl.push(this.scrollLeft);
				st.push(this.scrollTop);
			});
		tLift = setTimeout(function () {
			var efp = Q.elementFromPoint(mx, my), i=0, cancel = false;
			$item.parents().each(function () {
				if (this.scrollLeft !== sl[i] || this.scrollTop !== st[i]) {
					cancel = true;
					return false;
				}
				++i;
			});
			if (cancel || !pressed || !(element === efp || $.contains(element, efp))) {
				return;
			}
			lift.call(element, event);
		}, Q.info.isTouchscreen ? state.lift.delayTouchscreen : state.lift.delay);
	}
	
	function lift(event) {
		if (tLift) clearTimeout(tLift);
		
		if (Q.Pointer.touchCount(event) !== 1) {
			return;
		}
		
		var $item = $(this);
		this.preventSelections();
		this.cloned = this.cloneNode(true).copyComputedStyle(this);
		Q.find(this, null, function (element, options, shared, parent, i) {
			if (parent) {
				var children = parent.cloned.children || parent.cloned.childNodes;
				element.cloned = children[i].copyComputedStyle(element);
			}
		});
		var $placeholder = $(this.cloned).css({
			opacity: options.placeholderOpacity
		}).insertAfter($item); //.hide('slow');
		
		this.cloned = this.cloneNode(true).copyComputedStyle(this);
		Q.find(this, null, function (element, options, shared, parent, i) {
			if (parent) {
				var children = parent.cloned.children || parent.cloned.childNodes;
				element.cloned = children[i].copyComputedStyle(element);
			}
		});
		var state = $this.state('Q/sortable');
		
		var x = Q.Pointer.getX(event),
			y = Q.Pointer.getY(event),
			offset = $item.offset();
		
		gx = x - offset.left;
		gy = y - offset.top;
	
		var $dragged = $(this.cloned);
		$('*', $dragged).each(function () {
			$(this).css('pointerEvents', 'none');
		});
		
		$item.hide();
		$(this).data('Q/sortable', {
			$placeholder: $placeholder,
			$dragged: $dragged,
			parentNode: $placeholder[0].parentNode,
			nextSibling: $placeholder[0].nextSibling,
			position: $item.css('position'),
			left: $item.css('left'),
			top: $item.css('top'),
			zIndex: $item.css('z-index'),
		});
		$placeholder.css('pointer', 'move')
			.addClass('Q-sortable-placeholder');
		$dragged.prependTo('body')
			.css({
				opacity: options.draggedOpacity,
				position: 'absolute', 
				zIndex: $this.state('Q/sortable').zIndex,
				pointerEvents: 'none'
			}).css({ // allow a reflow to occur
				left: x - gx,
				top: y - gy
			}).addClass('Q-sortable-dragged');
		var factor = state.lift.zoom;
		if (factor != 1) {
			Q.Animation.play(function (x, y) {
				var f = factor*y+(1-y);
				$dragged.css({
					'-moz-transform': 'scale('+f+')',
					'-webkit-transform': 'scale('+f+')',
					'-o-transform': 'scale('+f+')',
					'-ms-transform': 'scale('+f+')',
					'transform': 'scale('+f+')'
				});
			}, state.lift.animate);
		}
		lifted = true;
		Q.handle(options.onLift, $this, [this, {
			event: event,
			$dragged: $dragged, 
			$placeholder: $placeholder
		}]);
	}

	function dropHandler(event, target) {
		pressed = false;
		if (!lifted) {
			return;
		}
		var x = Q.Pointer.getX(event),
		    y = Q.Pointer.getY(event),
			$target = getTarget(x, y),
			state = $this.state('Q/sortable');
		complete(!$target && state.requireInside);
		return false;
	}
	
	function clickHandler(event, target) {
		// return false;
	}
	
	function complete(revert) {
		if (tLift) clearTimeout(tLift);
		if (tScroll) clearTimeout(tScroll);
		if (iScroll) clearInterval(iScroll);
		var $item = $(document).data(dataLifted);
		if (!$item) return;
		
		var data = $item.data('Q/sortable');
		$(document).removeData(dataLifted)
			.off(Q.Pointer.move, moveHandler)
			.off(Q.Pointer.end, dropHandler)
			.off(Q.Pointer.click, clickHandler);
		$item.off(Q.Pointer.move, moveHandler)
			.off(Q.Pointer.end, dropHandler)
			.off(Q.Pointer.click, clickHandler);
		if (!data) return;
		if (revert) {
			$item.show();
//			data.parentNode.insertBefore($item[0], data.nextSibling);
		} else {
			$item.insertAfter(data.$placeholder).show();
		}
		data.$placeholder.hide();
		$item.css({
			position: data.position, 
			zIndex: data.zIndex
		}).css({
			left: data.left,
			top: data.top
		});
		$item.removeData('Q/sortable');
		lifted = false;
		var params = {
			$placeholder: data.$placeholder,
			$dragged: data.$dragged,
			$scrolling: $scrolling
		};
		if (revert && $scrolling) {
			$scrolling.scrollLeft(osl);
			$scrolling.scrollTop(ost);
		}
		Q.handle(options.onDrop, $this, [$item, revert, params]);
		if (!revert) {
			Q.handle(options.onSuccess, $this, [$item, params]);
		}
		if (!data.$placeholder.retain) {
			data.$placeholder.remove();
		}
		if (!data.$dragged.retain) {
			data.$dragged.remove();
		}
		ost = osl = null;
		$scrolling = null;
	}
	
	function moveHandler(event) {
		var $item = $(document).data(dataLifted), x, y;
		if (!$item) {
			return;
		}
		if (Q.Pointer.touchCount(event) !== 1) {
			complete(true);
			return;
		}
		mx = x = Q.Pointer.getX(event), 
 		my = y = Q.Pointer.getY(event);
		if (!Q.info.isTouchscreen && !lifted) {
			if ((moveHandler.x !== undefined && Math.abs(moveHandler.x - x) > options.lift.threshhold)
			|| (moveHandler.y !== undefined && Math.abs(moveHandler.y - y) > options.lift.threshhold)) {
						console.log(Q.Pointer.touchCount(event), event);
				lift.call($item[0], event);
			}
		}
		if ((moveHandler.x !== undefined && Math.abs(moveHandler.x - x) > options.scroll.threshhold)
		|| (moveHandler.y !== undefined && Math.abs(moveHandler.y - y) > options.scroll.threshhold)) {
			scrolling($item, x, y);
		}
		moveHandler.x = x;
		moveHandler.y = y;
		if (lifted) {
			move($item, x, y);
			return false;
		}
	}

	function move($item, x, y) {
		var data = $item.data('Q/sortable');
		data.$dragged.css({
			left: x - gx,
			top: y - gy
		});
		// remove text selection while dragging
		var sel = window.getSelection ? window.getSelection() : document.selection;
		if (sel) {
		    if (sel.removeAllRanges) {
		        sel.removeAllRanges();
		    } else if (sel.empty) {
		        sel.empty();
		    }
		}
		indicate($item, x, y);
	}
	
	function scrolling($item, x, y) {
		if (tScroll) clearTimeout(tScroll);
		if (!lifted) return;
		var state = $this.state('Q/sortable');
		var dx = 0, dy = 0;
		var speed = state.scroll.speed;
		var beyond = false;
		$item.parents().each(function () {
			var $t = $(this);
			if ($t.css('overflow') === 'visible') {
				return;
			}
			if ($t.width()) {
				if ($t.scrollLeft() > 0
				&& x < $t.offset().left + $t.width() * options.scroll.distance) {
					dx = -speed;
					beyond = (x < $t.offset().left);
				}
				if ($t.scrollLeft() + $t.innerWidth() < this.scrollWidth
				&& x > $t.offset().left + $t.width() * (1-options.scroll.distance)) {
					dx = speed;
					beyond = (x > $t.offset().left + $t.width());
				}
			}
			if ($t.height()) {
				if ($t.scrollTop() > 0
				&& y < $t.offset().top + $t.height() * options.scroll.distance) {
					dy = -speed;
					beyond = (y < $t.offset().top);
				}
				if ($t.scrollTop() + $t.innerHeight() < this.scrollHeight
				&& y > $t.offset().top + $t.height() * (1-options.scroll.distance)) {
					dy = speed;
					beyond = (y > $t.offset().top + $t.height());
				}
			}
			if (dx || dy) {
				$scrolling = $t;
				osl = (osl === null) ? $scrolling.scrollLeft() : osl;
				ost = (ost === null) ? $scrolling.scrollTop() : ost;
				return false;
			}
		});
		if (!dx && !dy) {
			if (iScroll) clearInterval(iScroll);
			scrolling.accel = 0;
			return;
		}
		var delay = Q.info.isTouchscreen ? state.scroll.delayTouchscreen : state.scroll.delay;
		tScroll = setTimeout(function () {
			var draggable;
			if (iScroll) clearInterval(iScroll);
			iScroll = setInterval(function () {
				scrolling.accel = scrolling.accel || 0;
				scrolling.accel += state.scroll.acceleration;
				scrolling.accel = Math.min(scrolling.accel, 1);
				if (dx) $scrolling.scrollLeft($scrolling.scrollLeft()+dx*scrolling.accel);
				if (dy) $scrolling.scrollTop($scrolling.scrollTop()+dy*scrolling.accel);
				move($item, x, y);
			}, 50);
		}, beyond ? 0 : delay);
	}
	
	function getDraggable(state) {
		return (state.draggable === '*') ? $this.children() : $(state.draggable, $this);
	}
	
	function getTarget(x, y) {
		var element = Q.elementFromPoint(x, y);
		var state = $this.state('Q/sortable');
		var $target = null;
		state.droppable = state.droppable || '*';
		var $jq = (state.droppable === '*')
			? $this.children(state.droppable)
			: $(state.droppable, $this);
		$jq.each(function () {
			var $t = $(this);
			if ($t.is(element) || $.contains(this, element)) {
				$target = $t;
				return false;
			}
		});
		return $target;
	}
	
	function indicate($item, x, y) {
		var $target = getTarget(x, y);
		var data = $item.data('Q/sortable')
		
		var element = Q.elementFromPoint(x, y);
		var pe = data.$dragged.css('pointer-events');
		var offset = $this.offset();
		if (x >= offset.left && x <= offset.left + $this.width()
		 && y >= offset.top && y <= offset.top + $this.height()) {
			if (pe !== 'none') {
				data.$dragged.css('pointer-events', 'none');
			}
		} else {
			if (pe !== 'auto') {
				data.$dragged.css('pointer-events', 'auto');
			}
		}
		
		var $placeholder = data.$placeholder;
		if (!$target) {
			var state = $this.state('Q/sortable');
			if (state.requireInside) {
				$item.after($placeholder);
			}
			return;
		}
		if ($target.is($placeholder)) {
			return;
		}
		function isTheSibling($target, direction, element){
			var result = false;
			var $siblings = (direction === 'before') ? $target.prevAll() : $target.nextAll();
			$siblings.each(function () {
				if (this === element) {
					result = true;
					return false;
				}
			});
			return result;
		}
		function isThe ($target, direction, element) {
		    function comparePosition(a, b) {
		        return a.compareDocumentPosition ? 
		          a.compareDocumentPosition(b) : 
		          a.contains ? 
		            (a != b && a.contains(b) && 16) + 
		              (a != b && b.contains(a) && 8) + 
		              (a.sourceIndex >= 0 && b.sourceIndex >= 0 ?
		                (a.sourceIndex < b.sourceIndex && 4) + 
		                  (a.sourceIndex > b.sourceIndex && 2) :
		                1)
		            + 0 : 0;
		    }
			element = element.jquery ? element[0] : element;
		    var position = comparePosition($target[0], element);
		    if ((position & 0x04) && direction === 'after') return true;
		    if ((position & 0x02) && direction === 'before') return true;
			return false;
		};
		data.$prevTarget = $target;
		var direction;
		if (isThe($target, 'before', $placeholder[0])) {
			$target.after($placeholder);
			direction = 'before';
		} else if (isThe($target, 'after', $placeholder[0])) {
			$target.before($placeholder);
			direction = 'after';
		}
		Q.handle(options.onIndicate, $this, [$item, {
			$target: $target,
			direction: direction,
			$placeholder: $placeholder,
			$dragged: data.$dragged,
			$scrolling: $scrolling
		}]);
	}
},

{	// default options:
	draggable: '*', // which elements can be draggable
	droppable: '*', // which elements can be moved
	zIndex: 999999,
	draggedOpacity: 0.8,
	placeholderOpacity: 0.1,
	lift: {
		delay: 300,
		delayTouchscreen: 300,
		threshhold: 20,
		zoom: 1.1,
		animate: 100
	},
	scroll: {
		delay: 300,
		delayTouchscreen: 300,
		threshhold: 0,
		distance: 0.15,
		speed: 20,
		acceleration: 0.1
	},
	requireInside: true,
	onLift: new Q.Event(),
	onIndicate: new Q.Event(),
	onDrop: new Q.Event(function ($item, revert, data) {
		var offset = $item.offset();
		var moreleft = 0, moretop = 0;
		var $scrolling = data.$scrolling;
		if ($scrolling) {
			var so = $scrolling.offset();
			var il = offset.left,
				it = offset.top,
				ir = il + $item.width(),
				ib = it + $item.height(),
				sl = so.left,
				st = so.top,
				sr = so.left + $scrolling.width(),
				sb = so.top + $scrolling.height();
			if (il < sl) {
				$scrolling.animate({'scrollLeft': il - sl + $scrolling.scrollLeft()}, 300);
				moreleft = sl - il;
			}
			if (it < st) {
				$scrolling.animate({'scrollTop': it - st + $scrolling.scrollTop()}, 300);
				moretop = st - it;
			}
			if (ir > sr) {
				$scrolling.animate({'scrollLeft': ir - sr + $scrolling.scrollLeft()}, 300);
				moreleft = sr - ir;
			}
			if (ib > sb) {
				$scrolling.animate({'scrollTop': ib - sb + $scrolling.scrollTop()}, 300);
				moretop = sb - ib;
			}
		}
		$item.css('opacity', 0).animate({'opacity': 1}, 300);
		data.$dragged.animate({
			opacity: 0,
			left: offset.left + moreleft,
			top: offset.top + moretop
		}, 300, function () {
			data.$dragged.remove(); // we have to do it ourselves since we retained it
		});
		data.$dragged.retain = true;
	}, 'Q/sortable'),
	onSuccess: new Q.Event()
},

{
	destroy: function () {
		// TODO: implement cleanup
		this.removeData('Q/sortable');
		this.off('.Q_sortable');
	}
}

);

})(window.jQuery, window, document);