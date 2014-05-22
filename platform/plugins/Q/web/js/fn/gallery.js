(function (Q, $, window, document, undefined) {

/**
 * @param options Object
 *  "images": an array of objects containing
 *    "src": required, url of the image, will be fed through Q.url()
 *    "alt": optional alt text
 *    "start": optional object indicating 
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
	
	var $this = this, i, image, img, imgs=[], current, tm, anim, gallery;
	var intervals = {
		"": function (x, y, params) {

		},
		kenburns: function (x, y, params) {
			var image = o.images[params.current];
			var img = imgs[params.current];
			var interval = image.interval || {};
			var from = $.extend({}, o.interval.from, interval.from);
			var to = $.extend({}, o.interval.to, interval.to);
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
		}
	};
	var transitions = {
		crossfade: function (x, y, params) {
			imgs[params.current].css({'visibility': 'visible', 'opacity': y});
			if (params.previous < 0) return;
			if (y !== 1) {
				imgs[params.previous].css({'visibility': 'visible', 'opacity': 1-y});
			} else {
				imgs[params.previous].css({'visibility': 'hidden'});
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
	$this.css({'overflow': 'hidden'});
	
	function loadImage(index, callback) {
		if (imgs[index]) {
			if (callback) callback(index, imgs);
			return;
		}
		var image = o.images[index];
		img = $('<img />').attr({
			'alt': image.alt ? image.alt : 'image ' + index,
			'src': Q.url(image.src)
		}).css({'visibility': 'hidden', 'position': 'absolute', 'top': '0px', 'left': '0px'})
		.appendTo($this)
		.load(onLoad);
		imgs[index] = img;
		img.each(function () {
			if (this.complete) {
				$(this).unbind('load');
				onLoad();
			}
		});
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
				var t = $.extend(true, {}, o.transition, o.images[current].transition);
				var transition = transitions[o.transition.type || ""];
				Q.handle(o.onTransition, $this, [current, imgs, o]);
				if (!o.transitionToFirst && previous === -1) {
					transition(1, 1, { current: current, previous: previous });
					beginInterval();
					return;
				}
				anim = Q.Animation.play(
					transition,
					t.duration,
					t.ease,
					{ current: current, previous: previous }
				);
				beginInterval();
			}
			function beginInterval() {
				var transition = $.extend(true, {}, o.transition, o.images[current].transition);
				var interval = $.extend(true, {}, o.interval, o.images[current].interval);
				anim = Q.Animation.play(
					intervals[interval.type || ""],
					interval.duration,
					interval.ease,
					{ current: current }
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
			if (anim) {
				anim.pause();
			}
			clearTimeout(tm);
		},
		resume: function () {
			if (anim) {
				anim.resume();
			}
		},
		rewind: function () {
			current = -1;
			anim = null;
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
		duration: 500,
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