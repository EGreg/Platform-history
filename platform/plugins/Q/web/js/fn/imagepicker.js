(function (Q, $, window, document, undefined) {

/**
 * Q Tools
 * @module Q-tools
 */

/**
 * jQuery plugin that allows to choose and upload an image to the server by clicking / tapping on it.
 * Works on various platforms (desktop and mobile etc) in similar way. On mobiles allows to choose picture
 * from photo library or take an instant camera photo if OS supports such functionality.
 * Should be applied to <img /> element like this $('#someimg').plugin('Q/imagepicker', options).
 * @class Q imagepicker
 * @constructor
 * @param {Object} [options] options is an Object that contains parameters for function
 * @param {Object} [options.saveSizeName] Required hash where key is the preferred image size and value is the image name. Several key-value pairs may be given and image will be generated and saved in different files.
*   Key may be just one number, e.g. '100' which means square image 100x100 or in format '<width>x<height>', e.g. '80x120' to make non-square image.
 *  You can have one of <width> or <height> be empty, and then it will automatically keep the proportions.
 *  Or you can pass 'x' and then it will keep the original width and height of the image.
 * @default {}
 * @param {String} [options.url] url is a url to post to.
 * @param {String} [options.path] Can be a URL path or a function returning a URL path. It must exist on the server.
 * @default 'uploads'
 * @param {String} [options.subpath] A subpath which may be created on the server if it doesn't already exist.
 * @default ''
 * @param {String} [options.showSize] showSize is a key in saveSizeName to show on success. Optional.
 * @default null
 * @param {Object} [options.crop] crop  If provided, must be an object with structure: { 'x': left, 'y': top, 'w': width, 'h': height }. Optional.
 * The image saved on the server will be cropped according to given parameters.
 *   @param {Number} [options.crop.x] x is a left value for cropping
 *   @param {Number} [options.crop.y] y is a top value for cropping
 *   @param {Number} [options.crop.w] w is a width value for cropping
 *   @param {Number} [options.crop.h] h is a height value for cropping
 * @default Q.action('Q/image')
 * @param {Event} [options.preprocess] preprocess is a function which is triggering before image upload.
 * Its "this" object will be a jQuery of the imagepicker element
 * The first parameter is a callback, which should be called with an optional
 * hash of overrides, which can include "data", "path", "subpath", "save", "url", "loader" and "crop"
 * @param {Array} [options.cameraCommands] cameraCommands is an Array of titles for the commands that pop up to take a photo
 * @param {Event} [options.onClick] onClick is a function to execute during the click, which may cancel the click
 * @param {Event} [options.onSuccess] onSuccess is Q.Event which is called on successful upload. First parameter will be the server response with
 * hash in format similar to 'saveSizeName' field. Optional.
 * @param {Event} [options.onError] onError Q.Event which is called if upload failed. Optional.
 */
Q.Tool.jQuery('Q/imagepicker', function (o) {
	var $this = this;
	var input = $('<input type="file" accept="image/gif, image/jpeg, image/png" class="Q_imagepicker_file" />');
	input.css({
		'visibility': 'hidden',
		'height': '0',
		'width': '0',
		'top': '0',
		'left': '0',
		'position': 'absolute'
	});
	var originalSrc = $this.attr('src');
	if (originalSrc.indexOf('?') < 0) {
		$this.attr('src', originalSrc+"?"+Date.now()); // cache busting
	}
	$this.before(input);
	$this.addClass('Q_imagepicker');
	
	function _callback (err, res) {
		var state = $this.state('Q/imagepicker');
		var msg = Q.firstErrorMessage(err) || Q.firstErrorMessage(res && res.errors);
		if (msg) {
			$this.attr('src', state.oldSrc).stop().removeClass('Q_imagepicker_uploading');
			return Q.handle(o.onError, $this, [msg]);
		}
		var key = o.showSize;
		if (!key) {
			// by default set src equal to first element of the response
			key = Q.firstKey(res.slots.data, {nonEmpty: true});
		}
		var c = Q.handle(o.onSuccess, $this, [res.slots.data, key]);
		if (c !== false && key) {
			$this.attr('src', Q.url(res.slots.data[key]+"?"+Date.now()));
		}
		$this.removeClass('Q_imagepicker_uploading');
	}
	
	function _upload(data) {
		if (o.preprocess) {
			o.preprocess.call($this, _doUpload);
		} else {
			_doUpload();
		}
		function _doUpload(override) {
			if (override === false || (override && override.cancel)) {
				var state = $this.state('Q/imagepicker');
				$this.attr('src', state.oldSrc).stop().removeClass('Q_imagepicker_uploading');
				return;
			}
			var path = $this.state('Q/imagepicker').path;
			path = (typeof path === 'function') ? path() : path;
			var subpath = $this.state('Q/imagepicker').subpath;
			subpath = (typeof subpath === 'function') ? subpath() : subpath;
			var params = {
				'data': data,
				'path': path,
				'subpath': subpath,
				'save': o.saveSizeName,
				'url': o.url,
				'loader': o.loader
			};
			if (o.crop) {
				params.crop = o.crop;
			}
			Q.extend(params, override);
			var state = $this.state('Q/imagepicker');
			if (params.save && !params.save[state.showSize]) {
				throw new Q.Error("Q/imagepicker tool: no size found corresponding to showSize");
			}
			
			if (params.loader) {
				var callable = params.loader;
				delete params.loader;
				Q.handle(callable, null, [params, _callback]);
			} else {
				var url = params.url;
				delete params.url;
				Q.request(url, 'data', _callback, {
					fields: params,
					method: 'POST'
				});
			}
		}
	}
	
	function _process() {
		var state = $this.state('Q/imagepicker');
		state.oldSrc = $this.attr('src');
		if (o.throbber) {
			$this.attr('src', Q.url(o.throbber));
		}
		$this.addClass('Q_imagepicker_uploading');
		var reader = new FileReader();
		reader.onload = function() {
			_upload(reader.result);
		};
		reader.onerror = function () { 
			setTimeout(function() { 
				callback("Error reading file", res);
			}, 0);
		};
		reader.readAsDataURL(this.files[0]);

		// clear the input, see http://stackoverflow.com/a/13351234/467460
		input.wrap('<form>').closest('form').get(0).reset();
		input.unwrap();
	}

	if (navigator.camera) {
		// "file" input type is not supported
		$this.on([Q.Pointer.click, '.Q_imagepicker'], function(e) {
			navigator.notification.confirm("", function(index) {
				if (index === 3) return;
				var source = Camera.PictureSourceType[index === 1 ? "CAMERA" : "PHOTOLIBRARY"];
				navigator.camera.getPicture(function(data){
					_upload("data:image/jpeg;base64," + data);
				}, function(msg){
					alert(msg);
				}, { quality: 50,
					sourceType: source,
					destinationType: Camera.DestinationType.DATA_URL
				});
			}, "", o.cameraCommands.join(','));
			e.preventDefault();
		});
	} else {
		// natively support "file" input
		$this.on([Q.Pointer.click, '.Q_imagepicker'], function(e) {
			input.click();
			e.preventDefault();
		});
		input.click(function () {
			if (o.onClick && o.onClick() === false) {
				return false;
			}
		});
		input.change(function () {
			if (!this.value) {
				return; // it was canceled
			}
			_process.call(this);
		});
		function _cancel(e) {
			e.preventDefault();
		}
		$this.on({
			 dragover: _cancel,
			 dragenter: _cancel,
			 drop: function (e) {
				 _process.call(e.originalEvent.dataTransfer);
				 e.preventDefault();
			 }
		});
	}
},

{
	path: 'uploads',
	subpath: '',
	saveSizeName: {},
	showSize: null,
	crop: null,
	url: Q.action("Q/image"),
	throbber: null,
	preprocess: null,
	cameraCommands: ["Take new photo","Select from library","Cancel"],
	onSuccess: new Q.Event(function() {}, 'Q/imagepicker'),
	onError: new Q.Event(function(message) {
		alert('Image upload error' + (message ? ': ' + message : '') + '.');
	}, 'Q/imagepicker')
},

{
	/**
	 * Removes the imagepicker functionality from the element
	 * @method remove
	 */
	remove: function () {
		return this.each(function() {
			var $this = $(this);
			$this.off([Q.Pointer.click, '.Q_imagepicker']);
			if ($this.next().hasClass('Q_imagepicker_file')) {
				$this.next().remove();
			}
		});
	}
});

})(Q, jQuery, window, document);