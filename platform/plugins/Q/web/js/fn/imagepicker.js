(function ($, window, document, undefined) {

/**
 * @module Q
 * @submodule Plugins
 * @class jQuery
 * @namespace Q
 * Plugin that allows to choose and upload an image to the server by clicking / tapping on it.
 * Works on various platforms (desktop and mobile etc) in similar way. On mobiles allows to choose picture
 * from photo library or take an instant camera photo if OS supports such functionality.
 * Should be applied to <img /> element like this $('#someimg').plugin('Q/imagepicker', options).
 * @method imagepicker
 * @param {Object} options A hash of options which can include:
 *   'saveSizeName': Required hash where key is the preferred image size and value is the image name. Several key-value pairs may
 *                   be given and image will be generated and saved in different files. Key may be just one number, e.g. '100'
 *                   which means square image 100x100 or in format '<width>x<height>', e.g. '80x120' to make non-square image.
 *                   You can have one of <width> or <height> be empty, and then it will automatically keep the proportions.
 *                   Or you can pass 'x' and then it will keep the original width and height of the image.
 *   'path': Defaults to 'uploads'. Can be a URL path or a function returning a URL path. It must exist on the server.
 *   'subpath': Defaults to ''. The subpath which may be created on the server.
 *   'showSize': Optional. The key in saveSizeName to show on success.
 *   'crop': Optional. If provided, must be and object with such structure: { 'x': x, 'y': y, 'w': width, 'y': height }.
 *           The image saved on the server will be cropped according to given parameters.
 *   'url': The url to post to. Defaults to Q.action('Q/image')
 *   'preprocess': You can specify a function here which will run before the upload.
 *           Its "this" object will be a jQuery of the imagepicker element
 *           The first parameter is a callback, which should be called with an optional 
 *           hash of overrides, which can include "data", "path", "subpath", "save", "url" and "crop"
 *   'onClick': A function to execute during the click, which may cancel the click
 *   'onSuccess': Optional. Q.Event which is called on successful upload. First parameter will be the server response with
 *                hash in format similar to 'saveSizeName' field.
 *   'onError': Optional. Q.Event which is called if upload failed.
 */
Q.Tool.jQuery('Q/imagepicker', function (o) {
	var self = this;
	if (o.showSize && o.saveSizeName && !o.saveSizeName[o.showSize]) {
		throw "Q/imagepicker tool: options.saveSizeName[options.showSize] is missing";
	}
	return this.each(function() {
		var $this = $(this);
		var input = $('<input type="file" accept="image/gif, image/jpeg, image/png" class="Q_imagepicker_file" />');
		input.css({ 'visibility': 'hidden', 'height': '0', 'width': '0', 'position': 'absolute' });
		var originalSrc = $this.attr('src');
		if (originalSrc.indexOf('?') < 0) {
			$this.attr('src', originalSrc+"?"+Date.now()); // cache busting
		}
		$this.after(input);
		$this.addClass('Q_imagepicker');
		
		function upload(data) {
			if (o.preprocess) {
				o.preprocess.call($this, _doUpload);
			} else {
				_doUpload();
			}
			function _doUpload(override) {
				var params = {
					'data': data,
					'path': $this.state('Q/imagepicker').path,
					'subpath': $this.state('Q/imagepicker').subpath,
					'save': o.saveSizeName,
					'url': o.url
				};
				if (o.crop) {
					params.crop = o.crop;
				}
				Q.extend(params, override);
				var url = params.url;
				delete params.url;
				$.post(Q.ajaxExtend(url, 'data'), params).always(function() {
					if (o.showMask && Q.Mask) {
						Q.Mask.hide('Q.imagepickerMask');
					}
					input.val('');
				}).success(function(res) {
					var state = $this.state('Q/imagepicker');
					if (res.errors) {
						$this.attr('src', state.oldSrc).stop().removeClass('Q_imagepicker_uploading');
						Q.handle(o.onError, this, [res.errors[0].message]);
					} else {
						var key = o.showSize;
						if (!key) {
							// by default set src equal to first element of the response
							key = Q.first(res.slots.data, {nonEmpty: true});
						}
						if (key) {
							$this.attr('src', Q.url(res.slots.data[key]+"?"+Date.now()))
								.removeClass('Q_imagepicker_uploading');
						}
						Q.handle(o.onSuccess, self, [res.slots.data, key]);
					}
				}).error(function() {
					var state = $this.state('Q/imagepicker');
					$this.attr('src', state.oldSrc).removeClass('Q_imagepicker_uploading');
					Q.handle(o.onError, self);
				});
			}
		}

		if (navigator.camera) {
			// "file" input type is not supported
			$this.on(Q.Pointer.click + '.Q_imagepicker', function(e) {
				navigator.notification.confirm("", function(index) {
					if (index === 3) return;
					var source = Camera.PictureSourceType[index === 1 ? "CAMERA" : "PHOTOLIBRARY"];
					navigator.camera.getPicture(function(data){
						upload("data:image/jpeg;base64," + data);
					}, function(msg){
						alert(msg);
					}, { quality: 50,
						sourceType: source,
						destinationType: Camera.DestinationType.DATA_URL
					});
				}, "", "Take new photo,Select from library,Cancel");
				e.preventDefault();
			});
		} else {
			// natively support "file" input
			$this.on(Q.Pointer.click + '.Q_imagepicker', function(e) {
				input.click();
				e.preventDefault();
			});
			input.click(function () {
				if (o.onClick && o.onClick() === false) {
					return false;
				}
			});
			input.change(function (e) {
				if (!this.value) {
					return; // it was canceled
				}
				var state = $this.state('Q/imagepicker');
				state.oldSrc = $this.attr('src');
				if (o.throbber) {
					$this.attr('src', Q.url(o.throbber));
				}
				$this.addClass('Q_imagepicker_uploading');
				$this.animate({ 'opacity': o.loadingOpacity }, 'fast');
				var reader = new FileReader();
				reader.onload = function() {
					upload(reader.result);
				};
				reader.onerror = function () { setTimeout(function() { alert("Error reading file"); }, 0); };
				reader.readAsDataURL(this.files[0]);
			});
		}
	});
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
	onSuccess: new Q.Event(function() {}),
	onError: new Q.Event(function(message) {
		alert('Image upload error' + (message ? ': ' + message : '') + '.');
	}, 'Q/imagepicker')
},

{
	destroy: function () {
		return this.each(function() {
			var $this = $(this);
			$this.off(Q.Pointer.click + '.Q_imagepicker');
			if ($this.next().hasClass('Q_imagepicker_file')) {
				$this.next().remove();
			}
		});
	}
});

})(jQuery, window, document);