/*
 * Streams/image/preview tool.
 * Renders a tool to preview (and possibly replace) images
 * @param options {Object}
 *   A hash of options, which include:
 *   "publisherId": Required.
 *   "streamName": If empty, and "editable" is true, then this can be used to add new related Streams/image streams.
 *   "related": A hash with properties "publisherId" and "streamName", and usually "type"
 *   "editable": Whether the tool should allow authorized users to replace the image
 *   "imagepicker": Any options to pass to the imagepicker -- see its options. Must include "showSize".
 *   "onUpdate": A function to execute when the icon is updated
 *   "showFile": Optional. The image file to show, to override imagepicker.showSize option for some reason.
 */
Q.Tool.define("Streams/image/preview", function(options) {
	
	var tool = this;
	if (!options.imagepicker || !options.imagepicker.showSize) {
		throw "Streams/image/preview tool: missing options.imagepicker.showSize";
	}
	var parts = options.imagepicker.showSize.split('x');
	if (parts[0]) {
		this.element.style.width = parts[0] + "px";
	}
	if (parts[1]) {
		this.element.style.height = parts[1] + "px";
	}
	tool.element.innerHTML = '';
	var img = document.createElement('img');
	img.setAttribute('alt', 'loading');
	img.setAttribute('src', Q.url(options.throbber));
	img.style.opacity = 0.5;
	tool.element.appendChild(img);
	Q.Streams.get(tool.state.publisherId, tool.state.streamName, function (err) {
		if (err) {
			return console.warn(err);
		}
		if (!options.imagepicker.saveSizeName) {
			options.imagepicker.saveSizeName = {}
			Q.each(Q.Streams.image.sizes, function (i, size) {
				options.imagepicker.saveSizeName[size] = size;
			});
		}
		tool.stream = this;
		tool.refresh();
		this.onFieldChanged('icon').set(function () {
			tool.refresh();
		});
		if (this.access.writeLevel >= Q.Streams.WRITE_LEVEL.editPending) {
			var ipo = Q.extend({}, options.imagepicker, {
				preprocess: function (callback) {
					if (tool.state.streamName) {
						return Q.Streams.get(tool.state.publisherId, tool.state.streamName, function (err) {
							if (err) {
								return console.warn(err);
							}
							tool.stream = this;
							callback({subpath: 'streams/' + this.fields.publisherId + '/' + this.fields.name});
						});
					}
					Streams.create({
						publisherId: options.publisherId,
						type: 'Streams/image'
					}, function (err) {
						if (err) {
							return console.warn(err);
						}
						tool.state.publisherId = this.publisherId;
						tool.state.streamName = this.name;
						tool.stream = this;
						callback({subpath: 'streams/' + this.publisherId + '/' + this.name});
					}, tool.state.related);
				},
				onSuccess: function (data, key) {
					Q.Streams.Message.wait(
						tool.state.publisherId,
						tool.state.streamName,
						-1,
						function () {
							tool.state.onUpdate.handle.call(tool, data);
						}
					);
				}
			});
			tool.$('img').plugin('Q/imagepicker', ipo);
		}
	});
},

{
	related: null,
	editable: false,
	imagepicker: {},
	showFile: null,
	throbber: "plugins/Q/img/throbbers/spinner_sticky_gray.gif",
	onUpdate: new Q.Event()
},

{
	refresh: function () {
		var tool = this, state = tool.state, stream = this.stream;
		var file = state.showFile
			|| state.imagepicker.saveSizeName[state.imagepicker.showSize]
			|| state.imagepicker.saveSizeName[Q.first(state.imagepicker.saveSizeName, {nonEmpty: true})];
		var icon = stream && stream.fields.icon && stream.fields.icon !== 'default' ? stream.fields.icon : 'Streams/image';
		var img = document.createElement('img');
		img.setAttribute('src', Q.Streams.iconUrl(icon, file));
		img.setAttribute('alt', stream.fields.title);
		this.element.innerHTML = '';
		tool.element.appendChild(img);
	}
}

);