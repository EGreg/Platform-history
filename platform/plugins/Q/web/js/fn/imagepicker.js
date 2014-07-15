(function (Q, $, window, document, undefined) {

/**
 * Plugin that allows to choose and upload an image to the server by clicking / tapping on it.
 * Works on various platforms (desktop and mobile etc) in similar way. On mobiles allows to choose picture
 * from photo library or take an instant camera photo if OS supports such functionality.
 * Should be applied to <img /> element like this $('#someimg').plugin('Q/imagepicker', options).
 * @module Q
 * @submodule Plugins
 * @class jQuery
 * @namespace Q
 * @method imagepicker
 * @param {Object} [options] options is an Object that contains parameters for function
 * @param {Object} [options.saveSizeName] saveSizeName Required hash where key is the preferred image size and value is the image name. Several key-value pairs may
 *                   be given and image will be generated and saved in different files. Key may be just one number, e.g. '100'
 *                   which means square image 100x100 or in format '<width>x<height>', e.g. '80x120' to make non-square image.
 *                   You can have one of <width> or <height> be empty, and then it will automatically keep the proportions.
 *                   Or you can pass 'x' and then it will keep the original width and height of the image.
 * @default {}
 * @param {Object} [options.cropping]
 * @param {Boolean} [options.cropping.dialog]
 * @param {Boolean} [options.cropping.jCrop]
 *
 * @param {String} [options.path] path Can be a URL path or a function returning a URL path. It must exist on the server.
 * @default 'uploads'
 * @param {String} [options.subpath] subpath is a subpath which may be created on the server.
 * @default ''
 * @param {String} [options.showSize] showSize is a key in saveSizeName to show on success. Optional.
 * @default null
 * @param {Object} [options.crop] crop  If provided, must be an object with structure: { 'x': left, 'y': top, 'w': width, 'h': height }. Optional.
 * The image saved on the server will be cropped according to given parameters.
 *   @param {Number} [options.crop.x] x is a left value for cropping
 *   @param {Number} [options.crop.y] y is a top value for cropping
 *   @param {Number} [options.crop.w] w is a width value for cropping
 *   @param {Number} [options.crop.h] h is a height value for cropping
 * @param {String} [options.url] url is a url to post to.
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
	var state = $this.state('Q/imagepicker');

	function _callback (err, res) {
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
			$this.attr('src', Q.url(res.slots.data[key]+"?"+Date.now()));
		}
		$this.removeClass('Q_imagepicker_uploading');
	}

         function _doCanvasCrop (data, coord, callback) {
//              nothing to crop
            if ( ! data || ! coord ) {
                throw new Q.Exception('Q/imagepicker: Not specified neccessary data!');
            }

            var canvas = $('<canvas style="display:none"></canvas>').appendTo('body')[0];

            if (!( canvas && canvas.getContext('2d') )) {
                throw new Q.Exception('Q/imagepicker: Canvas is not supported!');
            }

//          canvas should be equal to cropped image
            canvas.width = coord.width;
            canvas.height = coord.height;
            var context = canvas.getContext('2d');
            var imageObj = new Image();

            imageObj.onload = function() {
                // draw cropped image
                var sourceX = coord.x;
                var sourceY = coord.y;
                var sourceWidth = coord.width;
                var sourceHeight = coord.height;
                var destWidth = coord.width;
                var destHeight = coord.height;
                var destX = 0;
                var destY = 0;

                context.drawImage(imageObj, sourceX, sourceY, sourceWidth, sourceHeight, destX, destY, destWidth, destHeight);
                var imageData = canvas.toDataURL();
                $(canvas).remove();
                callback.call(this, imageData );


            };
            imageObj.src = data;


        };

        function _calculateImageSize(requiredSize, imageSize) {
            var calcSize = {};
            if ( requiredSize.width && requiredSize.height ) {
//              if specified two dimensions - we should remove small size to avoid double reductions
                if ( requiredSize.width > requiredSize.height ) {
                    requiredSize.height = null;
                } else {
                    requiredSize.width = null;
                }

            }
            if ( requiredSize.width ) {
                if ( requiredSize.width > imageSize.width ) {
                    throw new Q.Error("Q/imagepicker tool: the image is too small");
                }
                calcSize.width = requiredSize.width;
                var ratio = requiredSize.width/imageSize.width;
                calcSize.height = Math.ceil(imageSize.height * ratio);
            }
            if ( requiredSize.height ) {
                if ( requiredSize.height > imageSize.height ) {
                    throw new Q.Error("Q/imagepicker tool: the image is too small");
                }
                calcSize.height = requiredSize.height;
                var ratio = requiredSize.height/imageSize.height;
                calcSize.width = Math.ceil(imageSize.width * ratio);
            }

            return calcSize;
        };

//        function _calcSizeQDialog(img) {
//            //      get size of available place
//            var mandatory_margin = 100; //the space for margins of Q.Dialog window
//            var page = {
//                width:  $(window).width(),
//                height: $(window).height()
//            };
//            page.ratio = page.width > page.height ? page.height/page.width : page.width/page.height;
//            var ratio = img.width/img.height;
////            ? img.height/img.width : img.width/img.height;
//            var dialog = {width: img.width, height: img.height};
//            page.width -= mandatory_margin; page.height -= mandatory_margin;
//
//
////          if image size is more then page size, image should be reduced
////          there can be two loops if first loop reduces a first side but other side is higher then page
//            while ( dialog.width > page.width || dialog.height > page.height ) {
//
////              find max side of image and check if it's higher then the same page side
//                if ( dialog.width > page.width ) {
//                    dialog.width = page.width;
//                    dialog.height = page.width/ratio;
//                }
//                if ( dialog.height > page.height ) {
//                    dialog.height = page.height;
//                    dialog.width = dialog.height * ratio;
//                }
//            }
//
//            return dialog;
//        };

        function _calculateRequiredSize (saveSizeName) {
//          TODO: should be refactored
//          http://ejohn.org/blog/fast-javascript-maxmin/
//            Array.prototype.max = function(){
//                return Math.max.apply( Math, this );
//            };

            var widths = [], heights = [];
            Q.each(saveSizeName, function(key, size) {
                var requiredSize = {
                    width: size.split('x')[0],
                    height: size.split('x')[1]
                };

                if (requiredSize.width)
                    widths.push(requiredSize.width);

                if (requiredSize.height)
                    heights.push(requiredSize.height);
            });

            return {
                width: Math.max.apply( Math, widths ),
                height: Math.max.apply( Math, heights )
            };
        };
        
	function _upload(data) {

		if (state.preprocess) {
			state.preprocess.call($this, _doCropping);
		} else {
            _doCropping();
		}

        function _doCropping(override) {
            var params = {
                'data': data,
            };
            Q.extend(params, override);

            if (! state.saveSizeName && ! state.cropping  ) {
                _doUpload(params);
                return;
            }

            var img = new Image,
                imgInfo = {};


            img.onload = function() {
//              TODO add option useAnySize
                if (state.saveSizeName  && ! state.cropping ) {
//                  do reduce image to showSize by default
                    var requiredSize  = _calculateRequiredSize(state.saveSizeName);

                    var neededImgSize = _calculateImageSize(requiredSize, img);
                    var coord = neededImgSize;
                    coord.x = 0; coord.y = 0;

                    _doCanvasCrop(params.data, coord, function(cropImg) {
                        params.data = cropImg;
                        _doUpload(params);
                    });
                }
                if (state.saveSizeName  && state.cropping ) {
                    function _cropAndUpload(coord) {

//                      1) TODO calc if crop area is not 1:1 to real
//                      2) get coord from Q/viewport
                        _doCanvasCrop(img.src, coord, function(data) {
                            _doUpload({data:data});
                        });
                    };
                    imgInfo.height = img.height;
                    imgInfo.width = img.width;
//                    imgInfo.ratio = img.width > img.height ? img.height/img.width : img.width/img.height;

//                    var dialogSize = _calcSizeQDialog(img);


                    var croppingElement = imgInfo.content = $('<img />').attr({src: img.src});
//                        = ['<img src="',
//                        img.src,
//                        '" id="Q_imagepicker_cropping"',
////                        ' width="'+imgInfo.width,
////                        '" height="'+imgInfo.height,
//                        '" />'].join('');

                    Q.Dialogs.push({
                        className: 'Q_Dialog_imagepicker',
                        title: 'Edit the image',
                        content: imgInfo.content,
                        destroyOnClose: true,
//                        size: {width:dialogSize.width, height: dialogSize.height},
                        fullscreen: true,
                        beforeClose: function() {
                            var result = $('.Q_viewport_tool', this)
                                .state('Q/viewport')
                                .result;
                               _cropAndUpload(result);
                        },
                        onActivate
                        : {"Q/imagepicker": function () {
//                          TODO: width and height should be proportial to orginal file
                            croppingElement.css({width:1000, height:750})
                                .plugin('Q/viewport',{
                                    initial:{left: 0, top: 0, width: 200, height: 200 }
                                })
                            }
                        }
                    });
                }
            };
            img.src = params.data;

        }


		function _doUpload(override) {
			if (override === false || (override && override.cancel)) {
				$this.attr('src', state.oldSrc).stop().removeClass('Q_imagepicker_uploading');
				return;
			}
			var params = {
				'data': data,
				'path': state.path,
				'subpath': state.subpath,
				'save': state.saveSizeName,
				'url': state.url,
				'loader': state.loader
			};
			if (state.crop) {
				params.crop = state.crop;
			}
			Q.extend(params, override);
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
			if (state.onClick && state.onClick() === false) {
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
    cropping: false,
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