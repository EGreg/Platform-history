/*
 * Streams/smalltext/preview tool.
 * Renders a tool to preview (and possibly replace) smalltexts
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
 *   "showFile": Optional. The image file to show, to override imagepicker.showSize option for some reason.
 *   "throbber": The url of an image to use as an activity indicator when the image is loading
 *   "templates": Under the keys "views", "edit" and "create" you can override options for Q.Template.render .
 *       The fields passed to the template include "alt", "titleTag" and "titleClass"
 *   "onCreate": An event that occurs after a new stream is created by a creatable preview
 *   "onUpdate": An event that occurs when the icon is updated via this tool
 *   "onRefresh": An event that occurs when the icon is refreshed
 *   "onRemove": An event that occurs when the icon is removed via the 'remove' action

 */
Q.Tool.define("Streams/smalltext/preview", function(options) {
	
	var tool = this;
	if (!tool.state.imagepicker || !tool.state.imagepicker.showSize) {
		throw "Streams/image/preview tool: missing options.imagepicker.showSize";
	}
	var state = tool.state, ip = state.imagepicker;
	var parts = ip.showSize.split('x');

	if (!ip.saveSizeName) {
		ip.saveSizeName = {};
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
		$(tool.element).addClass('Streams_smalltext_preview_create');
		Q.Template.render(
			'Streams/smalltext/preview/create',
			fields,
			function (err, html) {
				
				function handleClick() {
					Q.Streams.retainWith(tool).create({
						publisherId: state.publisherId,
						type: 'Streams/smalltext',
						icon: icon
					}, function (err, stream, icon) {
						if (err) {
							callback(err);
							return console.warn(err);
						}
						state.publisherId = this.fields.publisherId;
						state.streamName = this.fields.name;
						tool.stream = this;
						callback(null, {
							slots: {
								data: icon
							}
						});
						state.onCreate.handle.call(tool);
						tool.stream.refresh(function () {
							_render();
							state.onUpdate.handle.call(tool, data);
						}, {messages: true});
					}, state.related);
					return false;
				}
				
				if (err) {
					return console.warn(err);
				}
				tool.element.innerHTML = html;

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
					clo.onRelease = clo.onRelease || new Q.Event();
					clo.onRelease.set(function (evt, over) {
						if (over) {
							handleClick();
						}
					}, tool);
					add.plugin('Q/clickable', clo);
				} else {
					add.on(Q.Pointer.click, tool, handleClick);
				}
			},
			state.templates.create
		);
	}

	function _preview() {
		if (parts[0]) { tool.$('.Streams_smalltext_preview_icon').width(parts[0]) }
		if (parts[1]) { tool.$('.Streams_smalltext_preview_icon').height(parts[0]) }

		var img = document.createElement('img');
		img.setAttribute('alt', 'loading');
		img.setAttribute('src', Q.url(state.throbber));
		img.setAttribute('class', 'Streams_smalltext_preview_loading');
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
					onSuccess: {'Streams/smalltext/preview': function (data, key) {
						stream.refresh(function () {
							state.onUpdate.handle.call(tool, data);
						}, {messages: true});
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
		title: "New Item",
		clickable: true,
		addIconSize: 100
	},
	imagepicker: {
		showSize: "50",
		fullSize: "50"
	},
	showFile: null,
	templates: {
		view: {
			dir: 'plugins/Streams/views',
			name: 'Streams/smalltext/preview/view',
			fields: { alt: 'image', titleClass: '', titleTag: 'h3' }
		},
		edit: {
			dir: 'plugins/Streams/views',
			name: 'Streams/smalltext/preview/edit',
			fields: { alt: 'image', titleClass: '', titleTag: 'h3' }
		},
		create: {
			dir: 'plugins/Streams/views',
			name: 'Streams/smalltext/preview/create',
			fields: { alt: 'new', titleClass: '', titleTag: 'h3' }
		}
	},
	inplace: {},
	actions: {
		position: 'mr'
	},
	throbber: "plugins/Q/img/throbbers/bars32.gif",
	onCreate: new Q.Event(),
	onUpdate: new Q.Event(),
	onRefresh: new Q.Event(),
	onRemove: new Q.Event(function () {
		this.$().hide('slow', function () {
			$(this).remove();
		});
	}, 'Streams/smalltext/preview')
},

{
	refresh: function (callback) {
		var tool = this, state = tool.state;

		Q.Streams.get(state.publisherId, state.streamName, function (err) {
			var fem = Q.firstErrorMessage(err);
			if (fem) {
				return console.warn("Streams/smalltext/preview: " + fem);
			}
			var stream = tool.stream = this;
			var file = state.showFile
				|| state.imagepicker.saveSizeName[state.imagepicker.showSize]
				|| state.imagepicker.saveSizeName[Q.first(state.imagepicker.saveSizeName, {nonEmpty: true})];
			var full = state.imagepicker.saveSizeName[state.imagepicker.fullSize] || file;
			var icon = stream && stream.fields.icon && stream.fields.icon !== 'default'
				? stream.fields.icon
				: 'Streams/smalltext';

			var jq = tool.$('img.Streams_smalltext_preview_icon');
			if (jq.length) {
				jq.off('load.Streams-smalltext-preview').on('load.Streams-smalltext-preview', function () {
					tool.state.onRefresh.handle.apply(tool, []);
				});
				jq.attr('src', Q.Streams.iconUrl(icon, file)+'?'+Date.now());
				return true;
			}

			var inplace = Q.extend({
				publisherId: state.publisherId,
				streamName: state.streamName,
				field: 'title',
				inplaceType: 'text'
			}, state.inplace);
			if (state.editable === false) {
				inplace.editable = false;
			}
			var f = tool.state.template && tool.state.template.fields;
			var fields = Q.extend({}, state.templates.edit.fields, f, {
				src: Q.Streams.iconUrl(icon, file)+'?'+Date.now(),
				srcFull: Q.Streams.iconUrl(icon, full)+'?'+Date.now(),
				alt: stream.fields.title,
				inplace: tool.setUpElementHTML('div', 'Streams/inplace', inplace)
			});
			var tpl = (state.editable !== false || stream.testWriteLevel('suggest'))
				? 'edit' 
				: 'view';
			Q.Template.render(
				'Streams/smalltext/preview/'+tpl,
				fields,
				function (err, html) {
					if (err) {
						return console.warn(err);
					}
					tool.element.innerHTML = html;
					$('img', tool.element).off('load.Streams-smalltext-preview').on('load.Streams-smalltext-preview', function () {
						tool.state.onRefresh.handle.apply(tool, []);
					});
					Q.activate(tool, callback);
				},
				state.templates[tpl]
			);
		});
	}
}

);

Q.Template.set(
	'Streams/smalltext/preview/view',
	'<img src="{{& srcFull}}" alt="{{alt}}" class="Streams_smalltext_preview_icon">'
	+ '<div class="Streams_smalltext_contents {{titleClass}}"><{{titleTag}}>{{& inplace}}</{{titleTag}}></div>'
);

Q.Template.set(
	'Streams/smalltext/preview/edit',
	'<img src="{{& src}}" alt="{{alt}}" class="Streams_smalltext_preview_icon">'
	+ '<div class="Streams_smalltext_contents {{titleClass}}"><{{titleTag}}>{{& inplace}}</{{titleTag}}></div>'
);

Q.Template.set(
	'Streams/smalltext/preview/create',
	'<img src="{{& src}}" alt="{{alt}}" class="Streams_smalltext_preview_add">'
	+ '<div class="Streams_smalltext_contents {{titleClass}}"><{{titleTag}}>{{& title}}</{{titleTag}}></div>'
);