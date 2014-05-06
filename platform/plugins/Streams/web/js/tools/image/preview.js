(function (Q, $, window, undefined) {

/*
 * Streams/image/preview tool.
 * Renders a tool to preview (and possibly replace) images
 * @param options {Object}
 *   A hash of options, which include:
 *   "publisherId": Required.
 *   "streamName": If empty, and "creatable" is true, then this can be used to add new related Streams/image streams.
 *   "related": A hash with properties "publisherId" and "streamName", and usually "type" and "weight"
 *   "editable": Set to false to avoid showing even authorized users an interface to replace the image or text
 *   "creatable": Optional fields to override in case streamName = "", including:
 *     "title": Optional title for the case when streamName = "", i.e. the image composer
 *     "clickable": Whether the image composer image is clickable
 *     "addIconSize": The size in pixels of the square add icon
 *   "imagepicker": Any options to pass to the Q/imagepicker jquery plugin -- see its options.
 *   "inplace": Any options to pass to the Q/inplace tool -- see its options.
 *   "actions": Any options to pass to the Q/actions jquery plugin -- see its options.
 *   "overrideSize": Optional. A hash of {icon: size} pairs to override imagepicker.showSize when the icon is a certain string. The empty string matches all icons.
 *   "throbber": The url of an image to use as an activity indicator when the image is loading
 *   "templates": Under the keys "views", "edit" and "create" you can override options for Q.Template.render .
 *       The fields passed to the template include "alt", "titleTag" and "titleClass"
 *   "onCreate": An event that occurs after a new stream is created by a creatable preview
 *   "onUpdate": An event that occurs when the icon is updated via this tool
 *   "onRefresh": An event that occurs when the icon is refreshed
 *   "onLoad": An event that occurs when the icon is loaded
 *   "onRemove": An event that occurs when the icon is removed via the 'remove' action
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
			var file = (state.overrideSize && state.overrideSize[this.fields.icon])
				|| state.imagepicker.saveSizeName[state.imagepicker.showSize]
				|| Q.first(state.imagepicker.saveSizeName, {nonEmptyKey: true});
			var full = state.imagepicker.saveSizeName[state.imagepicker.fullSize] || file;
			var icon = stream && stream.fields.icon && stream.fields.icon !== 'default' ? stream.fields.icon : 'Streams/image';

			var jq = tool.$('img.Streams_image_preview_icon');
			if (jq.length) {
				tool.state.onRefresh.handle.apply(tool, []);
				jq.off('load.Streams-image-preview').on('load.Streams-image-preview', function () {
					tool.state.onLoad.handle.apply(tool, []);
				});
				jq.attr('src', Q.Streams.iconUrl(icon, file)+'?'+Date.now());
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
				src: Q.Streams.iconUrl(icon, file)+'?'+Date.now(),
				srcFull: Q.Streams.iconUrl(icon, full)+'?'+Date.now(),
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