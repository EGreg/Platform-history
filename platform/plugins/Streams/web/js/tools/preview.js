(function (Q, $, window, undefined) {

/**
 * @module Streams-tools
 */

/**
 * Renders a default interface for rendering stream preview
 * @class Streams preview
 * @constructor
 * @param {Object} [options] this object contains function parameters
 *   @param {String} [options.publisherId] The publisher's user id.
 *   @required
 *   @param {String} [options.streamName] If empty, and "creatable" is true, then this can be used to add new related streams.
 *   @param {Object} [options.related] A hash with properties "publisherId" and "streamName", and usually "type" and "weight"
 *   @param {Boolean} [options.editable] Set to false to avoid showing even authorized users an interface to replace the icon or title.
 *   You can also pass "icon" to make only the icon editable, or "title" to make only the title editable.
 *   @param {Object} [options.creatable] Optional fields to override in case streamName = "", including:
 *     @param {String} [options.creatable.title] Optional title for the case when streamName = "", i.e. the image composer
 *     @param {Boolean} [options.creatable.clickable] Whether the image composer image is clickable
 *     @param {Number} [options.creatable.addIconSize] The size in pixels of the square add icon
 *     @param {String} [options.creatable.type] The type of stream to create, defaults to "Streams/text/small"
 *     @param {Function} [options.creatable.preprocess]  Optional function which takes [callback, tool] and calls callback(objectToExtendAnyStreamFields)
 *   @param {Object} [options.imagepicker]  Any options to pass to the Q/imagepicker jquery plugin -- see its options. Pass null to disable this functionality.
 *   @param {Object} [options.inplace]  Any options to pass to the Q/inplace tool -- see its options. Pass null to disable this functionality.
 *   @param {Object} [options.actions]  Any options to pass to the Q/actions jquery plugin -- see its options. Pass null to disable this functionality.
 *   @param {Object} [options.overrideSize]  A hash of {icon: size} pairs to override imagepicker.showSize when the icon is a certain string. The empty string matches all icons.
 *   @param {String} [options.throbber]  The url of an image to use as an activity indicator when the image is loading
 *   @param {Object} [options.templates]  Under the keys "views", "edit" and "create" you can override options for Q.Template.render . The fields passed to the template include "alt", "titleTag" and "titleClass"
 *   @param {Q.Event} [options.onCreate] An event that occurs after a new stream is created by a creatable preview
 *   @param {Q.Event} [options.onUpdate] An event that occurs when the icon is updated via this tool
 *   @param {Q.Event} [options.onRefresh]  An event that occurs when the icon is refreshed
 *   @param {Q.Event} [options.onRemove] An event that occurs when the icon is removed via the 'remove' action
 */
Q.Tool.define("Streams/preview", function _Streams_preview(options) {
	
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
			Q.Streams.retainWith(tool).create(fields, function (err, stream, extra) {
				if (err) {
					return err;
				}
				state.related.weight = Q.getObject(['related', 'weight'], extra);
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
		var f = state.template && state.template.fields;
		var fields = Q.extend({}, state.templates.create.fields, f, {
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
	overrideSize: {},
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
	cacheBust: 1000,
	onCreate: new Q.Event(),
	onUpdate: new Q.Event(),
	onRefresh: new Q.Event(),
	onLoad: new Q.Event(),
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
			var file = (state.overrideSize && state.overrideSize[this.fields.icon])
				|| state.imagepicker.saveSizeName[state.imagepicker.showSize]
				|| Q.first(state.imagepicker.saveSizeName, {nonEmptyKey: true});
			var full = state.imagepicker.saveSizeName[state.imagepicker.fullSize] || file;
			var icon = stream && stream.fields.icon && stream.fields.icon !== 'default'
				? stream.fields.icon
				: "default";
			var p = Q.pipe(['inplace', 'icon'], function () {
				tool.state.onLoad.handle.apply(tool, []);
			});

			var jq = tool.$('img.Streams_preview_icon');
			if (jq.length) {
				tool.state.onRefresh.handle.apply(tool, []);
				jq.off('load.Streams-preview')
				.on('load.Streams-preview', function () {
					p.fill('icon')(tool, []);
				});
				jq.attr('src', Q.url(
					Q.Streams.iconUrl(icon, file), null, 
					{cacheBust: state.cacheBust}
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
				if (state.editable === false || state.editable === 'icon') {
					inplaceOptions.editable = false;
				}
				inplace = tool.setUpElementHTML('div', 'Streams/inplace', inplaceOptions);
			}
			var f = state.template && state.template.fields;
			var fields = Q.extend({}, state.templates.edit.fields, f, {
				src: Q.url(
					Q.Streams.iconUrl(icon, file), null, 
					{cacheBust: state.cacheBust}),
				srcFull: Q.url(
					Q.Streams.iconUrl(icon,full), null, 
					{cacheBust: state.cacheBust}),
				alt: stream.fields.title,
				inplace: inplace
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
					Q.activate(tool, {
						onLoad: {
							"Streams/preview": function () {
								p.fill('inplace').apply(this, arguments);
							}
						}
					},
					function () {
						tool.state.onRefresh.handle.apply(tool, []);
						$('img', tool.element).off('load.Streams-preview')
						.on('load.Streams-preview', function () {
							p.fill('icon').call(tool);
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

})(Q, jQuery, window);