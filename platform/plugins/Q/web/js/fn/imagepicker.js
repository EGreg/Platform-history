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
 * @param {Object} options.saveSizeName] Required hash where key is the preferred image size and value is the image name. Several key-value pairs may be given and image will be generated and saved in different files.
*   Key may be just one number, e.g. '100' which means square image 100x100 or in format '<width>x<height>', e.g. '80x120' to make non-square image.
 *  You can have one of <width> or <height> be empty, and then it will automatically keep the proportions.
 *  Or you can pass 'x' and then it will keep the original width and height of the image.
 * @default {}
 * @param {String} [options.url] url is a url to post to.
 * @param {String} [options.path="uploads"] Can be a URL path or a function returning a URL path. It must exist on the server.
 * @param {String} [options.subpath=""] A subpath which may be created on the server if it doesn't already exist.
 * @param {String} [options.showSize=null] showSize is a key in saveSizeName to show on success.
 * @param {String} [options.useAnySize=false] whether to tell the server to accept any size without complaining.
 * @param {Object} [options.crop] crop If provided, the image will be cropped according to the given parameters before it is saved on the server in the saveSizeName formats. If the browser supports it, the cropping will occur in the browser.
 *   @param {Number} [options.crop.x] left for cropping
 *   @param {Number} [options.crop.y] top for cropping
 *   @param {Number} [options.crop.w] width for cropping
 *   @param {Number} [options.crop.h] height value for cropping
 * @param {Boolean} [options.cropping=true] Whether to display an interface for selecting cropping images, before sending them to the server. If true, the cropping area overrides the crop option.
 * @default Q.action('Q/image')
 * @param {Q.Event} [options.preprocess] preprocess is a function which is triggering before image upload.
 * Its "this" object will be a jQuery of the imagepicker element
 * The first parameter is a callback, which should be called with an optional
 * hash of overrides, which can include "data", "path", "subpath", "save", "url", "loader" and "crop"
 * @param {Array} [options.cameraCommands] cameraCommands is an Array of titles for the commands that pop up to take a photo
 * @param {Q.Event} [options.onClick] onClick is an event to execute during the click, which may cancel the click
 * @param {Q.Event} [options.onSuccess] onSuccess is Q.Event which is called on successful upload. First parameter will be the server response with
 * an object in a format similar to the 'saveSizeName' field. Optional.
 * @param {Q.Event} [options.onError] onError Q.Event which is called if upload failed. Optional.
 * @param {Q.Event} [options.onTooSmall] onError Q.Event which is called if an image is selected that's too small for one of the sizes in saveSizeName. Return false to abort.
 */
Q.Tool.jQuery('Q/imagepicker', function _Q_imagepicker(o) {
	var $this = this;
	if (Q.isEmpty(o.saveSizeName)) {
		throw new Q.Error("Q/imagepicker: saveSizeName is required");
	}
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
	if (originalSrc && originalSrc.indexOf('?') < 0) {
		// cache busting
		$this.attr('src', Q.url(originalSrc, null, {cacheBust: 1000}));
	}
	$this.before(input);
	$this.addClass('Q_imagepicker');
	
	function _callback (err, res) {
		var state = $this.state('Q/imagepicker');
		var msg = Q.firstErrorMessage(err) || Q.firstErrorMessage(res && res.errors);
		if (msg) {
			$this.attr('src', state.oldSrc).stop().removeClass('Q_imagepicker_uploading');
			return Q.handle(state.onError, $this, [msg]);
		}
		var key = state.showSize;
		if (!key) {
			// by default set src equal to first element of the response
			key = Q.firstKey(res.slots.data, {nonEmpty: true});
		}
		var c = Q.handle(state.onSuccess, $this, [res.slots.data, key]);
		if (c !== false && key) {
			$this.attr('src', 
				Q.url(res.slots.data[key], null, {cacheBust: 1000})
			);
		}
		$this.removeClass('Q_imagepicker_uploading');
	}
	
	function _upload(data) {
		var state = $this.state('Q/imagepicker');
		if (state.preprocess) {
			state.preprocess.call($this, _doCropping);
		} else {
			_doCropping();
		}
		
		function _doCropping(override) {
			
			function _calculateRequiredSize (saveSizeName, imageSize) {
		        var widths = [], heights = [];
		        Q.each(saveSizeName, function(key, size) {
		            var parts = key.split('x');
					var w = parseInt(parts[0] || 0);
					var h = (parts.length === 2) ? parseInt(parts[1] || 0) : w;
					var r = imageSize.width / imageSize.height;
					widths.push(w || h * r || imageSize.height);
					heights.push(h || w / r || imageSize.width);
		        });

		        return {
		            width: Math.max.apply( Math, widths ),
		            height: Math.max.apply( Math, heights )
		        };
		    };
	
			function _checkRequiredSize(requiredSize, imageSize) {
				if (state.useAnySize) {
					return true;
				}
				if (requiredSize.width > imageSize.width
				 || requiredSize.height > imageSize.height) {
					var result = Q.handle(
						state.onTooSmall, state, 
						[requiredSize, imageSize]
					);
					if (result === false) {
						return false;
					}
				}
				return true;
		    }
			
	        function _selectionInfo(requiredSize, imageSize) {
	            if (!_checkRequiredSize(requiredSize, imageSize)) {
	            	return _revert();
	            }
	            var result = {};
	            if ( requiredSize.width && requiredSize.height ) {
	//              if specified two dimensions - we should remove small size to avoid double reductions
	                if ( requiredSize.width > requiredSize.height ) {
	                    requiredSize.height = null;
	                } else {
	                    requiredSize.width = null;
	                }

	            }
				var rqw = requiredSize.width;
				var rqh = requiredSize.height;
				var iw = imageSize.width;
				var ih = imageSize.height;
	            if (rqw) {
	                result.width = rqw;
	                result.height = Math.ceil(imageSize.height * rqw/imageSize.width);
	            }
	            if (rqh) {
	                result.height = rqh;
	                result.width = Math.ceil(imageSize.width * rqh/imageSize.height);
	            }
				result.left = (iw-result.width)/2;
				result.top = (ih-result.height)/2;
	            return result;
	        };
			
            function _doCanvasCrop (data, coord, callback) {
				// nothing to crop
				if ( ! data || ! coord ) {
				    throw new Q.Exception('Q/imagepicker: Not specified neccessary data!');
				}
				
				var canvas = $('<canvas style="display:none"></canvas>').appendTo('body')[0];
				
				if (!( canvas && canvas.getContext('2d') )) {
					return callback.call(this, data, params.crop);
				}

				// canvas should be equal to cropped image
				canvas.width = coord.requiredSize.width;
				canvas.height = coord.requiredSize.height;
				var context = canvas.getContext('2d');
				var $img = $('<img />');
				$img.on('load', function() {
				    // draw cropped image
				    var sourceLeft = coord.left;
				    var sourceTop = coord.top;
				    var sourceWidth = coord.width;
				    var sourceHeight = coord.height;
				    var destWidth = coord.requiredSize.width;
				    var destHeight = coord.requiredSize.height;
				    var destLeft = 0;
				    var destTop = 0;
				    context.drawImage(
						$img[0],
						sourceLeft, sourceTop, sourceWidth, sourceHeight,
						destLeft, destTop, destWidth, destHeight
					);
				    var imageData = canvas.toDataURL();
				    $(canvas).remove();
					$img.remove();
				    callback.call(this, imageData, null);
				});
				$img.attr('src', data);
				$img.appendTo('body');
			};
			
			function _onImgLoad() {
				var isw = imageSize.height = img.height;
				var ish = imageSize.width = img.width;
				var requiredSize  = _calculateRequiredSize(state.saveSizeName, imageSize);
				if (!_checkRequiredSize(requiredSize, imageSize)) {
					return _revert();
				}

				if (state.cropping) {
                    var $croppingElement = $('<img />').attr({ src: img.src })
						.css({'visibility': 'hidden'});
                    Q.Dialogs.push({
                        className: 'Q_Dialog_imagepicker',
                        title: state.croppingTitle,
                        content: $croppingElement,
                        destroyOnClose: true,
//                        size: {width:dialogSize.width, height: dialogSize.height},
                        fullscreen: Q.info.isMobile,
						apply: true,
                        onActivate : {
                            "Q/imagepicker": function ($dialog) {
								// TODO: width and height should be proportial to orginal file
								var w = requiredSize.width / imageSize.width;
								var h = requiredSize.height / imageSize.height;
								var rsw1 = rsw2 = requiredSize.width;
								var rsh1 = rsh2 = requiredSize.height;
								var dw = this.width();
								var dh = this.height();
								if (rsw2 != dw) {
									rsh2 *= dw / rsw1;
									rsw2 = dw;
								}
								if (rsh2 > dh) {
									rsw2 *= dh / rsh1;
									rsh2 = dh;
								}
								var maxScale = Math.min(rsw2 / rsw1, rsh2 / rsh1);
	                            $croppingElement.plugin('Q/viewport', {
                                    initial: {
										x: 0.5, 
										y: 0.5, 
										scale: Math.max(rsw2 / isw, rsh2 / ish)
									},
									width: rsw2,
									height: rsh2,
									maxScale: maxScale
                                }, function () {
                                	$croppingElement.css({'visibility': 'visible'});
                                });
                            }
                        },
                        beforeClose: function(res) {
							var state = $('.Q_viewport', res).state('Q/viewport');
                            var result = state.selection;
                            var coord = {
                                requiredSize: requiredSize,
                                left: result.left * imageSize.width,
                                top: result.top * imageSize.height,
                                width: Math.max(
									result.width * imageSize.width,
									requiredSize.width
								),
                                height: Math.max(
									result.height * imageSize.height,
									requiredSize.height
								)
                            };
                            if (!_checkRequiredSize(requiredSize, coord)) {
                            	return;
                            }
                            _doCanvasCrop(img.src, coord, function(data, crop) {
                                _doUpload({
                                    data: data,
									crop: crop
                                });
                            });
                        }
                    });
				} else {
					var coord = _selectionInfo(requiredSize, imageSize);
					coord.requiredSize = requiredSize;

					_doCanvasCrop(params.data, coord, function(data, crop) {
						params.data = data;
						params.crop = crop;
						_doUpload(params);
					});
				}
			}
			
			var params = {
				data: data
			};
			Q.extend(params, override);
			if (!state.cropping && !state.crop) {
				_doUpload(override);
				return;
			}
			
			var img = new Image;
			var imageSize = {};
			img.onload = _onImgLoad;
			img.src = params.data;
		}
		
		function _doUpload(override) {
			var state = $this.state('Q/imagepicker');
			if (override === false || (override && override.cancel)) {
				return _revert();
			}
			var path = state.path;
			path = (typeof path === 'function') ? path() : path;
			var subpath = state.subpath;
			subpath = (typeof subpath === 'function') ? subpath() : subpath;
			var params = {
				'data': data,
				'path': path,
				'subpath': subpath,
				'save': state.saveSizeName,
				'url': state.url,
				'loader': state.loader,
				'crop': null
			};
			Q.extend(params, override);
			if (Q.isEmpty(params.crop)) {
				delete params.crop;
			}
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
	
	function _revert() {
		$this.attr('src', state.oldSrc)
			.stop()
			.removeClass('Q_imagepicker_uploading');
	}
	
	function _process() {
		var state = $this.state('Q/imagepicker');
		state.oldSrc = $this.attr('src');
		if (state.throbber) {
			$this.attr('src', Q.url(state.throbber));
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
			var state = $this.state('Q/imagepicker');
			if (false === Q.handle(state.onClick, $this, [])) {
				return false;
			}
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
			}, "", state.cameraCommands.join(','));
			e.preventDefault();
		});
	} else {
		// natively support "file" input
		$this.on([Q.Pointer.click, '.Q_imagepicker'], function(e) {
			input.click();
			e.preventDefault();
		});
		input.click(function () {
			var state = $this.state('Q/imagepicker');
			if (false === Q.handle(state.onClick, $this, [])) {
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
	useAnySize: false,
	crop: null,
	cropping: true,
	croppingTitle: 'Adjust size and position',
	url: Q.action("Q/image"),
	throbber: null,
	preprocess: null,
	cameraCommands: ["Take new photo","Select from library","Cancel"],
	onClick: new Q.Event(),
	onSuccess: new Q.Event(function() {}, 'Q/imagepicker'),
	onError: new Q.Event(function(message) {
		alert('Image upload error' + (message ? ': ' + message : '') + '.');
	}, 'Q/imagepicker'),
	onTooSmall: new Q.Event(function (requiredSize, imageSize) {
		alert('Please choose a larger image.');
		return false;
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