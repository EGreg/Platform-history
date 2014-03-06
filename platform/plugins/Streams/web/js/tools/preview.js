/*
 * Streams/preview tool.
 * Renders a default tool to preview streams
 * @param options {Object}
 *   A hash of options, which include:
 *   "publisherId": Required. The publisher's user id.
 *   "streamName": If empty, and "creatable" is true, then this can be used to add new related streams.
 *   "related": A hash with properties "publisherId" and "streamName", and usually "type" and "weight"
 *   "editable": Set to false to avoid showing even authorized users an interface to replace the icon or title.
 *     You can also pass "icon" to make only the icon editable, or "title" to make only the title editable.
 *   "creatable": Optional fields to override in case streamName = "", including:
 *     "title": Optional title for the case when streamName = "", i.e. the image composer
 *     "clickable": Whether the image composer image is clickable
 *     "addIconSize": The size in pixels of the square add icon
 *     "type": The type of stream to create, defaults to "Streams/text/small"
 *     "preprocess": Optional function which takes [callback, tool] and calls callback(objectToExtendAnyStreamFields) 
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
Q.Tool.define("Streams/preview", function(options) {
	
	var tool = this, state = tool.state;
	if (!state.publisherId) {
		throw new Q.Error("Streams/image/preview tool: missing options.publisherId");
	}
	if (!state.imagepicker || !state.imagepicker.showSize) {
		throw new Q.Error("Streams/image/preview tool: missing options.imagepicker.showSize");
	}
	var ip = state.imagepicker,
	    parts = ip.showSize.split('x');

	if (!ip.saveSizeName) {
		ip.saveSizeName = {};
		ip.saveSizeName[ip.showSize] = ip.showSize;
		Q.each(Q.Streams.image.sizes, function (i, size) {
			ip.saveSizeName[size] = size;
		});
	}
	
	tool.element.addClass('Streams_preview');

	function handleClick(evt) {
		
		function _proceed(overrides) {

			var fields = Q.extend({
				publisherId: state.publisherId,
				type: state.creatable.streamType
			}, overrides);
			Q.Streams.retainWith(tool).create(fields, function (err, stream, icon) {
				if (err) {
					return err;
				}
				state.publisherId = this.fields.publisherId;
				state.streamName = this.fields.name;
				tool.stream = this;
				state.onCreate.handle.call(tool);
				tool.stream.refresh(function () {
					_render();
					state.onUpdate.handle.call(tool);
				}, {messages: true});
			}, state.related);
		}
		
		if (state.creatable && state.creatable.preprocess) {
			Q.handle(state.creatable.preprocess, this, [_proceed, tool, evt]);
		} else {
			_proceed();
		}
		return false;
	}

	function _composer () {
		var f = state.template && state.template.fields,
		fields = Q.extend({}, state.templates.create.fields, f, {
			src: Q.url('plugins/Streams/img/actions/add.png'),
			alt: state.creatable.title,
			title: state.creatable.title
		});
		tool.element.addClass('Streams_preview_create');
		Q.Template.render(
			'Streams/preview/create',
			fields,
			function (err, html) {
				if (err) return;
				tool.element.innerHTML = html;
				tool.element.removeClass('Streams_preview_create');

				var w = parts[0] || state.creatable.addIconSize,
					h = parts[0] || state.creatable.addIconSize;
				w = h = Math.min(w, h);
				if (w && h) {
					tool.$('.Streams_preview_add').width(w).height(h);
				}
				var container = tool.$('.Streams_preview_container');
				container.css('display', 'inline-block');
				if (state.creatable.clickable) {
					var clo = (typeof state.creatable.clickable === 'object')
						? state.creatable.clickable
						: {};
					container.plugin('Q/clickable', clo);
				}
				container.on(Q.Pointer.click, tool, handleClick);
			},
			state.templates.create
		);
	}

	function _preview() {
		if (parts[0]) { tool.$('.Streams_preview_icon').width(parts[0]) }
		if (parts[1]) { tool.$('.Streams_preview_icon').height(parts[0]) }

		var img = document.createElement('img');
		img.setAttribute('alt', 'loading');
		img.setAttribute('src', Q.url(state.throbber));
		img.setAttribute('class', 'Streams_preview_loading');
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
					onSuccess: {'Streams/preview': function (data, key) {
						stream.refresh(function () {
							state.onUpdate.handle.call(tool, data);
						}, {messages: true});
						return false;
					}}
				});
				if (state.editable !== 'title') {
					tool.$('img').plugin('Q/imagepicker', ipo);
				}
				if (state.actions && stream.testWriteLevel('close')) {
					var ao = Q.extend(state.actions, {
						actions: {
							'delete': function () {
								stream.remove(function (err) {
									if (err) {
										alert(err);
										return;
									}
									state.onRemove.handle.call(tool);
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
		addIconSize: 50,
		streamType: "Streams/text/small"
	},
	imagepicker: {
		showSize: "50",
		fullSize: "50"
	},
	showFile: null,
	templates: {
		view: {
			name: 'Streams/preview/view',
			fields: { alt: 'icon', titleClass: '', titleTag: 'h2' }
		},
		edit: {
			name: 'Streams/preview/edit',
			fields: { alt: 'icon', titleClass: '', titleTag: 'h2' }
		},
		create: {
			name: 'Streams/preview/create',
			fields: { alt: 'new', titleClass: '', titleTag: 'h2' }
		}
	},
	inplace: {},
	actions: {
		position: 'mr'
	},
	throbber: "plugins/Q/img/throbbers/loading.gif",
	onCreate: new Q.Event(),
	onUpdate: new Q.Event(),
	onRefresh: new Q.Event(),
	onRemove: new Q.Event(function () {
		this.$().hide('slow', function () {
			$(this).remove();
		});
	}, 'Streams/preview')
},

{
	refresh: function (callback) {
		var tool = this, state = tool.state;

		Q.Streams.get(state.publisherId, state.streamName, function (err) {
			var fem = Q.firstErrorMessage(err);
			if (fem) {
				return console.warn("Streams/preview: " + fem);
			}
			var stream = tool.stream = this;
			var file = state.showFile
				|| state.imagepicker.saveSizeName[state.imagepicker.showSize]
				|| state.imagepicker.saveSizeName[Q.first(state.imagepicker.saveSizeName, {nonEmpty: true})];
			var full = state.imagepicker.saveSizeName[state.imagepicker.fullSize] || file;
			var icon = stream && stream.fields.icon && stream.fields.icon !== 'default'
				? stream.fields.icon
				: "default";

			var jq = tool.$('img.Streams_preview_icon');
			if (jq.length) {
				jq.off('load.Streams-preview').on('load.Streams-preview', function () {
					state.onRefresh.handle.apply(tool, []);
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
			if (state.editable === false || state.editable === 'icon') {
				inplace.editable = false;
			}
			var f = state.template && state.template.fields;
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
				'Streams/preview/'+tpl,
				fields,
				function (err, html) {
					if (err) return;
					tool.element.innerHTML = html;
					$('img', tool.element).off('load.Streams-preview').on('load.Streams-preview', function () {
						state.onRefresh.handle.apply(tool, []);
					});
					Q.activate(tool, callback);
				},
				state.templates[tpl]
			);
		});
	}
}

);

Q.Template.set('Streams/preview/view',
	'<div class="Streams_preview_container Q_clearfix">'
	+ '<img src="{{& srcFull}}" alt="{{alt}}" class="Streams_preview_icon">'
	+ '<div class="Streams_preview_contents {{titleClass}}"><{{titleTag}}>{{& inplace}}</{{titleTag}}></div>'
	+ '</div>'
);

Q.Template.set('Streams/preview/edit',
	'<div class="Streams_preview_container Q_clearfix">'
	+ '<img src="{{& src}}" alt="{{alt}}" class="Streams_preview_icon">'
	+ '<div class="Streams_preview_contents {{titleClass}}"><{{titleTag}}>{{& inplace}}</{{titleTag}}></div>'
	+ '</div>'
);

Q.Template.set('Streams/preview/create',
	'<div class="Streams_preview_container Q_clearfix">'
	+ '<img src="{{& src}}" alt="{{alt}}" class="Streams_preview_add">'
	+ '<div class="Streams_preview_contents {{titleClass}}"><{{titleTag}}>{{& title}}</{{titleTag}}></div>'
	+ '</div>'
);