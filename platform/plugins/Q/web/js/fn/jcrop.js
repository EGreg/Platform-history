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

Q.Tool.jQuery('jcrop', 'plugins/Q/js/jquery.Jcrop.min.js');

Q.Tool.define("Q/jcrop", function(o) {
    $(this.element).plugin('jcrop', o,
        function () {
        });

},

{

});

})(Q, jQuery, window, document);