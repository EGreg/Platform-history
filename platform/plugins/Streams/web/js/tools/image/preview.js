(function (Q, $, window, undefined) {

/**
 * Streams/image/preview tool.
 * Renders a tool to preview (and possibly replace) images
 * @method image/preview
 * @param {Object} [options] this is an object that contains parameters for this function
 *   @param {String} [options.publisherId] Publisher ID
 *   @required
 *   @param {String} [options.streamName]  If empty, and <code>creatable<code> is true, then this can be used to add new related Streams/image streams.
 *   @optional
 *   @param {Object} [options.related] A hash with properties "publisherId" and "streamName", and usually "type" and "weight"
 *     @param {String} [options.related.publisherId]
 *     @param {String} [options.related.streamName]
 *     @param {String} [options.related.type]
 *     @optional
 *     @param {Number} [options.related.weight]
 *     @optional
 *   @param {Boolean} [options.editable] Set to false to avoid showing even authorized users an interface to replace the image or text
 *   @default true
 *   @param {Object} [options.creatable] Optional fields to override in case if streamName = ""
 *     @param {String} [options.creatable.title]
 *     @default "New Image"
 *     @param {Boolean} [options.creatable.clickable]
 *     @default true
 *     @param {Number} [options.creatable.addIconSize]
 *     @default 100
 *   @param {Object} [options.imagepicker] Any options to pass to the Q/imagepicker jquery plugin -- see its options.
 *   @see Q.jQuery.imagepicker
 *   @param {Object} [options.inplace] Any options to pass to the Q/inplace tool -- see its options.
 *   @see Q.jQuery.inplace
 *   @param {Object} [options.actions] Any options to pass to the Q/actions jquery plugin -- see its options.
 *   @see Q.jQuery.actions
 *   @param {Object} [options.overrideSize] A hash of {icon: size} pairs to override imagepicker.showSize when the icon is a certain string. The empty string matches all icons.
 *   @default {}
 *   @param {String} [options.throbber] The url of an image to use as an activity indicator when the image is loading
 *   @default "plugins/Q/img/throbbers/loading.gif"
 *   @param {Object} [options.templates] Under the keys "views", "edit" and "create" you can override options for Q.Template.render .
 *   The fields passed to the template include "alt", "titleTag" and "titleClass"
 *     @param {Object} [options.templates.view]
 *       @param {String} [options.templates.view.name]
 *       @default 'Streams/image/preview/view'
 *       @param {Object} [options.templates.view.fields]
 *         @param {String} [options.templates.view.fields.alt]
 *         @param {String} [options.templates.view.fields.titleClass]
 *         @param {String} [options.templates.view.fields.titleTag]
 *     @param {Object} [options.templates.edit]
 *       @param {String} [options.templates.edit.name]
 *       @default 'Streams/image/preview/edit'
 *       @param {Object} [options.templates.edit.fields]
 *         @param {String} [options.templates.edit.fields.alt]
 *         @param {String} [options.templates.edit.fields.titleClass]
 *         @param {String} [options.templates.edit.fields.titleTag]
 *     @param {Object} [options.templates.create]
 *       @param {String} [options.templates.create.name]
 *       @default 'Streams/image/preview/create'
 *       @param {Object} [options.templates.create.fields]
 *         @param {String} [options.templates.create.fields.alt]
 *         @param {String} [options.templates.create.fields.titleClass]
 *         @param {String} [options.templates.create.fields.titleTag]
 *   @param {Event} [options.onCreate] An event that occurs after a new stream is created by a creatable preview
 *   @param {Event} [options.onUpdate] An event that occurs when the icon is updated via this tool
 *   @param {Event} [options.onRefresh] An event that occurs when the icon is refreshed
 *   @param {Event} [options.onRemove] An event that occurs when the icon is removed via the 'remove' action
 */
Q.Tool.define("Streams/image/preview", function(options) {
	
	var tool = this;
	if (!tool.state.imagepicker || !tool.state.imagepicker.showSize) {
		throw new Q.Error("Streams/image/preview tool: missing options.imagepicker.showSize");
	}
	var state = tool.state, ip = state.imagepicker;
	var parts = ip.showSize.split('x');
	
	if (!ip.saveSizeName) {
		ip.saveSizeName = {};
		ip.saveSizeName[ip.showSize] = ip.showSize;
		Q.each(Q.Streams.image.sizes, function (i, size) {
			ip.saveSizeName[size] = size;
		});
	}
	
	function _composer () {
		var f = tool.state.template && tool.state.template.fields,
		fields = Q.extend({}, state.templates.create.fields, f, {
			src: Q.url('plugins/Streams/img/actions/add.png'),
			alt: state.creatable.title,
			title: state.creatable.title
		});
		$(tool.element).addClass('Streams_image_preview_create');
		Q.Template.render(
			'Streams/image/preview/create',
			fields,
			function (err, html) {
				if (err) return;
				tool.element.innerHTML = html;
				var ipo = Q.extend({}, ip, {
					loader: function (icon, callback) {
						Q.Streams.retainWith(tool).create({
							publisherId: state.publisherId,
							type: 'Streams/image',
							icon: icon
						}, function (err, stream, extra) {
							if (err) {
								return callback(err);
							}
							state.related.weight = Q.getObject(['related', 'weight'], extra);
							state.publisherId = this.fields.publisherId;
							state.streamName = this.fields.name;
							tool.stream = this;
							callback(null, {
								slots: {
									data: extra.icon
								}
							});
							state.onCreate.handle.call(tool);
						}, state.related);
					},
					preprocess: function (callback) {
						// TODO: have some kind of cropping interface for imagepicker
						callback();
					},
					onSuccess: {'Streams/image/preview': function (data, key) {
						tool.stream.refresh(function () {
							_render();
							state.onUpdate.handle.call(tool, data);
						}, {messages: true});
						return false;
					}}
				});

				var w = parts[0] || state.creatable.addIconSize,
					h = parts[0] || state.creatable.addIconSize;
				w = h = Math.min(w, h);
				if (w && h) {
					tool.$('.Streams_image_preview_add').width(w).height(h);
				}
				var add = tool.$('.Streams_image_preview_add');
				if (state.creatable.clickable) {
					var clo = (typeof state.creatable.clickable === 'object')
						? state.creatable.clickable
						: {};
					add.plugin('Q/clickable', clo);
				}
				add.plugin('Q/imagepicker', ipo);
			},
			state.templates.create
		);
	}
	
	function _preview() {
		if (parts[0]) { tool.$('.Streams_image_preview_icon').width(parts[0]) }
		if (parts[1]) { tool.$('.Streams_image_preview_icon').height(parts[0]) }

		var img = document.createElement('img');
		img.setAttribute('alt', 'loading');
		img.setAttribute('src', Q.url(state.throbber));
		img.setAttribute('class', 'Streams_image_preview_loading');
		tool.element.innerHTML = '';
		tool.element.appendChild(img);
		
		Q.Streams.Stream.onFieldChanged(state.publisherId, state.streamName, 'icon').set(_doRefresh, tool);

		Q.Streams.retainWith(tool).get(state.publisherId, state.streamName, _doRefresh);
		
		function _doRefresh (err) {
			
			var stream = this;
			tool.stream = stream;
			setTimeout(function () {
				tool.refresh(_afterRefresh);
			}, 0);
			
			function _afterRefresh () {
				if (state.editable === false || !stream.testWriteLevel('suggest')) {
					return;
				}
				var ipo = Q.extend({}, ip, {
					preprocess: function (callback) {
						Q.Streams.get(state.publisherId, state.streamName, function (err) {
							if (err) {
								return console.warn(err);
							}
							tool.stream = stream;
							callback({subpath: 'streams/' + stream.fields.publisherId + '/' + stream.fields.name});
						});
					},
					onSuccess: {'Streams/image/preview': function (data, key) {
						stream.refresh(function () {
							state.onUpdate.handle.call(tool, data);
						}, {messages: true, changed: {'icon': true}});
						return false;
					}}
				});
				tool.$('img').plugin('Q/imagepicker', ipo);
				if (tool.state.actions && stream.testWriteLevel('close')) {
					var ao = Q.extend(tool.state.actions, {
						actions: {
							'delete': function () {
								stream.remove(function (err) {
									if (err) {
										alert(err);
										return;
									}
									tool.state.onRemove.handle.call(tool);
								});
							}
						}
					});
					tool.$().plugin('Q/actions', ao);
				}
			}
		}
	}
	
	function _render() {
		if (!state.streamName) {
			_composer();
		} else {
			_preview();
		}
	}
	
	_render();
},

{
	related: null,
	editable: true,
	creatable: {
		title: "New Image",
		clickable: true,
		addIconSize: 100
	},
	imagepicker: {
		showSize: "x200",
		fullSize: "x"
	},
	overrideSize: {},
	templates: {
		view: {
			name: 'Streams/image/preview/view',
			fields: { alt: 'image', titleClass: '', titleTag: 'h2' }
		},
		edit: {
			name: 'Streams/image/preview/edit',
			fields: { alt: 'image', titleClass: '', titleTag: 'h2' }
		},
		create: {
			name: 'Streams/image/preview/create',
			fields: { alt: 'new', titleClass: '', titleTag: 'h2' }
		}
	},
	inplace: {},
	actions: {
		position: 'tr'
	},
	throbber: "plugins/Q/img/throbbers/loading.gif",
	onCreate: new Q.Event(),
	onUpdate: new Q.Event(),
	onRefresh: new Q.Event(),
	onLoad: new Q.Event(),
	onError: new Q.Event(),
	onRemove: new Q.Event(function () {
		this.$().hide('slow', function () {
			$(this).remove();
		});
	}, 'Streams/image/preview')
},

{
	refresh: function (callback) {
		var tool = this, state = tool.state;
		
		Q.Streams.get(state.publisherId, state.streamName, function (err) {
			var fem = Q.firstErrorMessage(err);
			if (fem) {
				return console.warn("Streams/image/preview: " + fem);
			}
			var stream = tool.stream = this;
			var size, attributes;
			size = state.imagepicker.saveSizeName[state.imagepicker.showSize];
			if (this.fields.attributes
			&& (attributes = JSON.parse(this.fields.attributes))
			&& attributes.sizes
			&& attributes.sizes.indexOf(state.imagepicker.showSize) < 0) {
				for (var i=0; i<attributes.sizes.length; ++i) {
					size = attributes.sizes[i];
					var parts1 = attributes.sizes[i].toString().split('x');
					var parts2 = state.imagepicker.showSize.toString().split('x');
					if (parts1.length === 1) parts1[1] = parts1[0];
					if (parts2.length === 2) parts2[1] = parts2[0];
					if (parseInt(parts1[0]||0) >= parseInt(parts2[0]||0)
					 && parseInt(parts1[1]||0) >= parseInt(parts2[1]||0)) {
						break;
					}
				}
			}
			var file = (state.overrideSize && state.overrideSize[this.fields.icon])
				|| size
				|| Q.first(state.imagepicker.saveSizeName, {nonEmptyKey: true});
			var full = state.imagepicker.saveSizeName[state.imagepicker.fullSize] || file;
			var icon = stream && stream.fields.icon && stream.fields.icon !== 'default' ? stream.fields.icon : 'Streams/image';

			var jq = tool.$('img.Streams_image_preview_icon');
			if (jq.length) {
				tool.state.onRefresh.handle.apply(tool, []);
				jq.off('load.Streams-image-preview').on('load.Streams-image-preview', function () {
					tool.state.onLoad.handle.apply(tool, []);
				});
				jq.attr('src', 
					Q.url(Q.Streams.iconUrl(icon, file), null,
					{cacheBust: 1000}
				));
				return true;
			}

			var inplace = null;
			if (state.inplace) {
				var inplaceOptions = Q.extend({
					publisherId: state.publisherId,
					streamName: state.streamName,
					field: 'title',
					inplaceType: 'text'
				}, state.inplace);
				if (state.editable === false) {
					inplaceOptions.editable = false;
				}
				inplace = tool.setUpElementHTML('div', 'Streams/inplace', inplaceOptions);
			}
			var f = tool.state.template && tool.state.template.fields;
			var fields = Q.extend({}, state.templates.edit.fields, f, {
				src: Q.url(
					Q.Streams.iconUrl(icon, file), null, 
					{cacheBust: 1000}),
				srcFull: Q.url(Q.Streams.iconUrl(icon, full), null,
					{cacheBust: 1000}),
				alt: stream.fields.title,
				inplace: inplace
			});
			var tpl = (state.editable === false || !stream.testWriteLevel('suggest'))
				? 'view' 
				: 'edit';
			Q.Template.render(
				'Streams/image/preview/'+tpl,
				fields,
				function (err, html) {
					if (err) return;
					tool.element.innerHTML = html;
					Q.activate(tool, function () {
						tool.state.onRefresh.handle.apply(tool, []);
						$('img', tool.element)
						.off('load.Streams-image-preview')
						 .on('load.Streams-image-preview', function () {
							tool.state.onLoad.handle.apply(tool, []);
						}).off('error.Streams-image-preview')
						  .on('error.Streams-image-preview', function () {
						  	tool.state.onError.handle.apply(tool, []);
						});
						callback.apply(tool);
					});
				},
				state.templates[tpl]
			);
		});
	}
}

);

Q.Template.set('Streams/image/preview/view',
	'<img src="{{& src}}" alt="{{alt}}" class="Streams_image_preview_icon">'
	+ '<div class="Streams_image_contents {{titleClass}}"><{{titleTag}}>{{& inplace}}</{{titleTag}}></div>'
);

Q.Template.set('Streams/image/preview/edit',
	'<img src="{{& src}}" alt="{{alt}}" class="Streams_image_preview_icon">'
	+ '<div class="Streams_image_contents {{titleClass}}"><{{titleTag}}>{{& inplace}}</{{titleTag}}></div>'
);

Q.Template.set('Streams/image/preview/create',
	'<img src="{{& src}}" alt="{{alt}}" class="Streams_image_preview_add">'
	+ '<div class="Streams_image_contents {{titleClass}}"><{{titleTag}}>{{& title}}</{{titleTag}}></div>'
);

})(Q, jQuery, window);