(function (Q, $, window, document, undefined) {

/**
 * @param options Object
 *  "images": an array of objects containing
 *    "src": required, url of the image, will be fed through Q.url()
 *    "caption": optional caption for the image
 *    "interval": optional number overriding default interval
 *    "transition": optional object overriding default transition
 *  "transition": optional object containing
 *    "duration": the number of milliseconds the transition should take (where the intervals overlap)
 *    "ease": the type of easing function to apply from Q.Animation.ease object. Defaults to 'smooth'
 *    "type": the type of transition. Can only be 'crossfade'
 *  "interval": optional object containing
 *    "duration": number of milliseconds between beginning times of consecutive transitions
 *    "ease": the type of easing function to apply from Q.Animation.ease object. Defaults to 'smooth'
 *    "type": what to do during this interval. Can be empty or 'kenburns'. Defaults to empty.
 *    "from": for "kenburns", an object containing "left", "top", "width" and "height"
 *    "to": for "kenburns", an object containing "left", "top", "width" and "height"
 *  "autoplay": whether to start playing the gallery when it loads. Defaults to true.
 *  "transitionToFirst": whether to use a transition to show the first image. Defaults to false.
 *  "loop": whether to show first image after last image is done. Defaults to true.
 *  "onLoad": fires when an image loads, also passes all loaded images
 *  "onTransition": fires when an image loads, also passes all loaded images
 */
Q.Tool.jQuery('Q/gallery', function (o) {
	
	var $this = this, i, image, imgs=[], caps=[], current, tm, gallery;
	var animTransition, animInterval, animPreviousInterval;
	var intervals = {
		"": function (x, y, params) {

		},
		kenburns: function (x, y, params) {
			var image = o.images[params.current];
			var img = imgs[params.current];
			var interval = image.interval || {};
			var from = Q.extend({}, 2, o.interval.from, 2, interval.from);
			var to = Q.extend({}, 2, o.interval.to, 2, interval.to);
			var z = y;
			var widthFactor = from.width + z*(to.width - from.width);
			var heightFactor = from.height + z*(to.height - from.height);
			var leftFactor = (from.left + z*(to.left - from.left));
			var topFactor = (from.top + z*(to.top - from.top));
			
			// crop to fit aspect ratio of the gallery
			var iw = img.width();
			var ih = img.height();
			var w = iw * widthFactor;
			var h = ih * heightFactor;
			var l = iw * leftFactor;
			var t = ih * topFactor;
			var r = w/h;
			var $w = $this.width();
			var $h = $this.height();
			var $r = $w/$h;
			if ($r < r) {
				var smallerW = h * $r;
				l += (w - smallerW) / 2;
				widthFactor = smallerW / iw;
				leftFactor = l / iw;
			} else {
				var smallerH = w / $r;
				t += (h - smallerH) / 2;
				heightFactor = smallerH / ih;
				topFactor = t / ih;
			}
			
			// scale and place the image to expose the clipped area
			var width = $w / widthFactor;
			var height = $h / heightFactor;
			var left = -leftFactor * width;
			var top = -topFactor * height; 
			img.css({
				left: left+'px',
				top: top+'px',
				width: width+'px',
				height: height+'px',
				visibility: 'visible'
			});
			caps[params.current].css('visibility', 'visible');
		}
	};
	var transitions = {
		crossfade: function (x, y, params) {
			imgs[params.current]
			.add(caps[params.current])
			.css({
				display: 'block',
				visibility: 'visible',
				opacity: y
			});
			if (params.previous < 0) return;				
			if (y !== 1) {
				imgs[params.previous]
				.add(caps[params.previous])
				.css({
					opacity: 1-y
				});
			} else {
				for (var i=0; i<imgs.length; ++i) {
					if (i === params.current) continue;
					imgs[i].add(caps[i]).css({
						display: 'none'
					});
				}
			}
			if (y === 1) {
				animPreviousInterval && animPreviousInterval.pause();
			}
		}
	};
	
	if (gallery = $this.data('gallery')) {
		gallery.pause();
		$this.empty();
		if (options === null) {
			return false;
		}
	}
	
	current = -1;
	var css = {
		overflow: 'hidden'
	};
	if ($this.css('position') === 'static') {
		css.position = 'relative';
	}
	$this.css(css);
	
	function loadImage(index, callback) {
		if (imgs[index]) {
			if (callback) callback(index, imgs);
			return;
		}
		var image = o.images[index];
		var img = $('<img />').attr({
			alt: image.caption ? image.caption : 'image ' + index,
			src: Q.url(image.src)
		}).css({
			visibility: 'hidden',
			position: 'absolute',
			top: '0px', 
			left: '0px'
		}).appendTo($this)
		.load(onLoad);
		imgs[index] = img;
		img.each(function () {
			if (this.complete) {
				$(this).unbind('load');
				onLoad();
			}
		});
		if (image.caption) {
			var css = image.style ? image.style : {};
			css['visibility'] = 'hidden';
			var cap = $('<div class="Q_gallery_caption" />')
				.css(css)
				.html(image.caption)
				.appendTo($this);
			caps[index] = cap;
		} else {
			caps[index] = $([]);
		}
		function onLoad() {
			imgs[index] = img;
			Q.handle(o.onLoad, $this, [$(this), imgs, o]);
			if (callback) callback(index, imgs);
		}
	}
	
	var gallery = {
		options: o,
		onLoad: o.onLoad,
		play: function () {
			this.next(true);
		},
		next: function (keepGoing) {
			var previous = current;
			++current;
			if (current >= o.images.length) {
				if (!o.loop) return;
				current = 0;
			}
			loadImage(current, function () {
				beginTransition();
			});
			function beginTransition() {
				var t = Q.extend({}, 2, o.transition, 2, o.images[current].transition);
				var transition = transitions[o.transition.type || ""];
				Q.handle(o.onTransition, $this, [current, imgs, o]);
				if (!o.transitionToFirst && previous === -1) {
					transition(1, 1, { current: current, previous: previous });
					beginInterval();
					return;
				}
				// animTransition && animTransition.pause();
				animTransition = Q.Animation.play(
					transition,
					t.duration,
					t.ease,
					{ current: current, previous: previous }
				);
				beginInterval();
			}
			function beginInterval() {
				var transition = Q.extend({}, 2, o.transition, 2, o.images[current].transition);
				var interval = Q.extend({}, 2, o.interval, 2, o.images[current].interval);
				animPreviousInterval = animInterval;
				animInterval = Q.Animation.play(
					intervals[interval.type || ""],
					interval.duration,
					interval.ease,
					{ current: current, previous: previous }
				);
				loadImage((current+1) % o.images.length, null); // preload next image
				if (keepGoing) {
					tm = setTimeout(function () {
						gallery.next(keepGoing);
					}, interval.duration - transition.duration);
				}
			}
		},
		pause: function () {
			animTransition && animTransition.pause();
			animInterval && animInterval.pause();
			clearTimeout(tm);
		},
		resume: function () {
			animTransition && animTransition.play();
			animInterval && animInterval.play();
		},
		rewind: function () {
			this.pause();
			current = -1;
			animTransition = null;
			animInterval = null;
		}
	};
	
	if (o.autoplay) {
		gallery.play();
	} else {
		gallery.next(false);
	}
	
	$this.data('gallery', gallery);
	
	return this;
	
},

{
	images: [],
	transition: {
		duration: 1000,
		ease: "smooth",
		type: "crossfade"
	},
	interval: {
		duration: 2000,
		ease: "smooth",
		type: "",
		from: { left: 0, top: 0, width: 1, height: 1 },
		to: { left: 0, top: 0, width: 1, height: 1 }
	},
	autoplay: true,
	transitionToFirst: false,
	loop: true,
	onLoad: null
}

);

})(Q, jQuery, window, document);