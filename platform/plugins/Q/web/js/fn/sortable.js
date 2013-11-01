(function ($, window, document, undefined) {

Q.Tool.jQuery('Q/sortable',

function (options) {

	var $this = $(this);
	var dataLifted = 'Q/sortable dragging', gx, gy, tLift, tScroll, iScroll, lifted;
	
	$(document).keydown(function (e) {
		if (e.keyCode == 27) { // escape key
			complete(true);
		}
	});
	Q.addEventListener(document, [Q.Pointer.cancel, Q.Pointer.leave], function () {
		complete(true);
	});
	
	options.draggable = options.draggable || '*';
	$this.on(Q.Pointer.start, options.draggable, function (event) {
		if (options.draggable === '*' && event.target.parentNode !== $this[0]) {
			return;
		}
		var $item = $(this);
		this.preventSelections();
		liftHandler.call(this, event);
	});

	function liftHandler(event) {
		if (Q.Pointer.which(event) > 1) {
			return; // only left mouse button or touches
		}
		var element = this;
		var state = $this.state('Q/sortable');
		tLift = setTimeout(function () {
			lift.call(element, event);
		}, Q.info.isTouchscreen ? state.lift.delayTouchscreen : state.lift.delay);
		$(document).data(dataLifted, $(this))
			.on(Q.Pointer.move, moveHandler);
		$(document).on(Q.Pointer.end, dropHandler);
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
			opacity: 0.1
		}).insertAfter($item); //.hide('slow');
		
		this.cloned = this.cloneNode(true).copyComputedStyle(this);
		Q.find(this, null, function (element, options, shared, parent, i) {
			if (parent) {
				var children = parent.cloned.children || parent.cloned.childNodes;
				element.cloned = children[i].copyComputedStyle(element);
			}
		});
		var $dragged = $(this.cloned); //.hide('slow');
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
				opacity: 0.5,
				// filter: 'blur(3px)',
				// '-webkit-filter': 'blur(3px)',
				// '-moz-filter': 'blur(3px)',
				// '-o-filter': 'blur(3px)',
				// '-ms-filter': 'blur(3px)',
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
			dragged: $dragged[0], 
			placeholder: $placeholder[0]
		}]);
	}

	function dropHandler(event, target) {
		complete();
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
			.off(Q.Pointer.end, dropHandler);
		if (!data) return;
		if (revert) {
			$item.show();
//			data.parentNode.insertBefore($item[0], data.nextSibling);
		} else {
			$item.insertAfter(data.$placeholder).show();
		}
		data.$placeholder.remove();
		data.$dragged.remove();
		$item.css({
			position: data.position, 
			zIndex: data.zIndex
		}).css({
			left: data.left,
			top: data.top
		});
		$item.removeData('Q/sortable');
		lifted = false;
		Q.handle(options.onDrop, $this, [$item[0], revert]);
		if (!revert) {
			Q.handle(options.onSuccess, $this, [$item[0]]);
		}
	}
	
	function moveHandler(event) {
		var $item = $(document).data(dataLifted);
		if (!$item) {
			return;
		}
		if (Q.Pointer.touchCount(event) !== 1) {
			complete(true);
			return;
		}
		var x = Q.Pointer.getX(event), 
		    y = Q.Pointer.getY(event);
		if (!Q.info.isTouchscreen && !lifted) {
			if ((moveHandler.x !== undefined && Math.abs(moveHandler.x - x) > options.lift.threshhold)
			|| (moveHandler.y !== undefined && Math.abs(moveHandler.y - y) > options.lift.threshhold)) {
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
		}
		event.preventDefault();
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
		var container = null;
		$item.parents().each(function () {
			var $t = $(this);
			if ($t.width() && $t.scrollLeft() > 0
			&& x < $t.offset().left + $t.width() * options.scroll.distance) {
				dx = -speed;
			}
			if ($t.width() && $t.scrollLeft() + $t.innerWidth() < this.scrollWidth
			&& x > $t.offset().left + $t.width() * (1-options.scroll.distance)) {
				dx = speed;
			}
			if ($t.height() && $t.scrollTop() > 0
			&& y < $t.offset().top + $t.height() * options.scroll.distance) {
				dy = -speed;
			}
			if ($t.height() && $t.scrollTop() + $t.innerHeight() < this.scrollHeight
			&& y > $t.offset().top + $t.height() * (1-options.scroll.distance)) {
				dy = speed;
			}
			if (dx || dy) {
				container = $t;
				return false;
			}
		});
		if (!dx && !dy) {
			if (iScroll) clearInterval(iScroll);
			scrolling.accel = 0;
			return;
		}
		tScroll = setTimeout(function () {
			if (iScroll) clearInterval(iScroll);
			iScroll = setInterval(function () {
				scrolling.accel = scrolling.accel || 0;
				scrolling.accel += state.scroll.acceleration;
				scrolling.accel = Math.min(scrolling.accel, 1);
				if (dx) container.scrollLeft(container.scrollLeft()+dx*scrolling.accel);
				if (dy) container.scrollTop(container.scrollTop()+dy*scrolling.accel);
			}, 50);
		}, options.scroll.delay);
		// if close to a boundary, set timeout, else clearit
	}
	
	function indicate($item, x, y) {
		var element = document.elementFromPoint(x, y);
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
		if (!$target) {
			return;
		}
		var data = $item.data('Q/sortable')
		var $placeholder = data.$placeholder;
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
		Q.handle(options.onIndicate, $this, [$item[0], {
			target: $target[0],
			direction: direction,
			placeholder: $placeholder[0],
			dragged: data.$dragged[0]
		}]);
	}
},

{	// default options:
	draggable: '*', // which elements can be draggable
	droppable: '*', // which elements can be moved
	zIndex: 999999,
	onSort: new Q.Event(),
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
	onLift: new Q.Event(),
	onIndicate: new Q.Event(),
	onDrop: new Q.Event(),
	onSuccess: new Q.Event()
},

{
	destroy: function () {
		// TODO: implement cleanup
	}
}

);

})(window.jQuery, window, document);