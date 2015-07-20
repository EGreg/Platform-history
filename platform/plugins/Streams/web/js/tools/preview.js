(function (Q, $, window, undefined) {

/**
 * @module Streams-tools
 */

/**
 * Provides base protocol and behavior for rendering a stream preview.
 * Should be combined with a tool on the same element that will actually
 * manage and render the interface.
 * @class Streams preview
 * @constructor
 * @param {Object} [options] this object contains function parameters
 *   @param {String} options.publisherId The publisher's user id.
 *   @required
 *   @param {String} [options.streamName] If empty, and "creatable" is true, then this can be used to add new related streams.
 *   @param {Object} [options.related] , Optional information to add a relation from the newly created stream to another one. Can include:
 *   @param {String} [options.related.publisherId] the id of whoever is publishing the related stream
 *   @param {String} [options.related.streamName] the name of the related stream
 *   @param {Mixed} [options.related.type] the type of the relation
 *   @param {Object} [options.related] A hash with properties "publisherId" and "streamName", and usually "type" and "weight". Usually set by a "Streams/related" tool.
 *   @param {Boolean|Array} [options.editable=true] Set to false to avoid showing even authorized users an interface to replace the image or text. Or set to an array naming only certain fields, which the rendering method would hopefully recognize.
 *   @param {Boolean} [options.removable=true] Set to false to avoid showing even authorized users an option to remove (or close) this stream
 *   @param {Object} [options.creatable] Optional fields you can override in case if streamName = "", 
 *     @param {String} [options.creatable.title="New Image"] Optional title for the case when streamName = "", i.e. the image composer
 *     @param {Boolean} [options.creatable.clickable=true] Whether the image composer image is clickable
 *     @param {Number} [options.creatable.addIconSize=100] The size in pixels of the square add icon
 *   @param {Object} [options.imagepicker] Any options to pass to the Q/imagepicker jquery plugin -- see its options.
 *   @uses Q imagepicker
 *   @param {Object} [options.actions] Any options to pass to the Q/actions jquery plugin -- see its options.
 *   @uses Q actions
 *   @param {Object} [options.sizes] If passed, uses this instead of Q.Streams.image.sizes for the sizes
 *   @param {Object} [options.overrideShowSize]  A hash of {icon: size} pairs to override imagepicker.showSize when the icon is a certain string. The empty string matches all icons.
 *   @param {String} [options.throbber="plugins/Q/img/throbbers/loading.gif"] The url of an image to use as an activity indicator when the image is loading
 *   @param {Number} [options.cacheBust=null] Number of milliseconds to use for combating the re-use of cached images when they are first loaded.
 *   @param {Q.Event} [options.beforeCreate] An event that occurs right before a creatable preview issue request to create a new stream
 *   @param {Q.Event} [options.onCreate] An event that occurs after a new stream is created by a creatable preview
 *   @param {Object} [options.templates] Under the keys "views", "edit" and "create" you can override options for Q.Template.render .
 *   The fields passed to the template include "alt", "titleTag" and "titleClass"
 *     @param {Object} [options.templates.create]
 *       @param {String} [options.templates.create.name]
 *       @default 'Streams/preview/create'
 *       @param {Object} [options.templates.create.fields]
 *         @param {String} [options.templates.create.fields.alt]
 *         @param {String} [options.templates.create.fields.titleClass]
 *         @param {String} [options.templates.create.fields.titleTag]
 */
Q.Tool.define("Streams/preview", function _Streams_preview(options) {
	var tool = this;
	var state = tool.state;
	if (!state.publisherId) {
		throw new Q.Error("Streams/preview tool: missing options.publisherId");
	}
	var si = state.imagepicker;
	if (!si || !si.showSize) {
		throw new Q.Error("Streams/preview tool: missing options.imagepicker.showSize");
	}
	if (!si.saveSizeName) {
		si.saveSizeName = {};
		si.saveSizeName[si.showSize] = si.showSize;
		Q.each(state.sizes || Q.Streams.image.sizes, function (i, size) {
			si.saveSizeName[size] = size;
		});
	}
	tool.element.addClass('Streams_preview');
	// default functionality for composer
	if (state.streamName) {
		tool.loading();
		tool.preview();
	} else {
		tool.composer();
	}
	// actual stream previews should be rendered by the derived tool's constructor
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
	throbber: "plugins/Q/img/throbbers/loading.gif",
	
	imagepicker: {
		showSize: "50",
		fullSize: "50"
	},
	sizes: null,
	overrideShowSize: {},
	cacheBust: null,
	cacheBustOnUpdate: 1000,

	actions: {
		position: 'mr'
	},
	
	beforeCreate: new Q.Event(),
	onCreate: new Q.Event(),
	onRefresh: new Q.Event(),
	onLoad: new Q.Event(),
	onRemove: new Q.Event(function () {
		this.$().hide(300, function () {
			$(this).remove();
		});
	}, 'Streams/preview'),
	onError: new Q.Event(function (err) {
		var fem = Q.firstErrorMessage(err);
		var position = this.$().css('position');
		this.$().css({
			'pointer-events': 'none',
			'position': (position === 'static' ? 'relative' : position),
			'overflow': 'hidden'
		})
		.append($("<div />").css({
			'opacity': '0.8',
			'font-size': '12px',
			'background': 'red',
			'position': 'absolute',
			'top': '0px',
			'left': '0px',
			'line-height': '12px',
			'opacity': 0
		}).text(err).animate({opacity: 0.5}, 3000));
	}, 'Streams/preview'),
	
	templates: {
		create: {
			name: 'Streams/preview/create',
			fields: { alt: 'new', titleClass: '', titleTag: 'h2' }
		}
	}
},

{
	create: function (evt) {
		function _proceed(overrides) {
			if (overrides != undefined && !Q.isPlainObject(overrides)) {
				return;
			}
			var fields = Q.extend({
				publisherId: state.publisherId,
				type: state.creatable.streamType
			}, overrides);
			state.beforeCreate.handle.call(tool);
			tool.loading();
			Q.Streams.retainWith(tool)
			.create(fields, tool, function (err, stream, extra) {
				if (err) {
					state.onError.handle.call(tool, err);
					return err;
				}
				var r = state.related;
				state.related.weight = Q.getObject(['related', 'weight'], extra);
				state.publisherId = this.fields.publisherId;
				state.streamName = this.fields.name;
				tool.stream = this;
				tool.stream.refresh(function () {
					state.onCreate.handle.call(tool, tool.stream);
					state.onRefresh.handle.call(tool, tool.stream);
					tool.preview();
				}, {messages: true});
			}, state.related);
		}
		var tool = this;
		var state = tool.state;
		if (state.creatable && state.creatable.preprocess) {
			Q.handle(state.creatable.preprocess, this, [_proceed, tool, evt]);
		} else {
			_proceed();
		}
	},
	composer: function _composer () {
		var tool = this;
		var state = tool.state;
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
				var parts = state.imagepicker.showSize.split('x');
				var w = parts[0] || state.creatable.addIconSize;
				var h = parts[0] || state.creatable.addIconSize;
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
				container.on(Q.Pointer.click, tool, tool.create.bind(tool));
			},
			state.templates.create
		);
	},
	loading: function _loading() {
		var tool = this;
		var state = tool.state;
		var img = document.createElement('img');
		img.setAttribute('alt', 'loading');
		img.setAttribute('src', Q.url(state.throbber));
		img.setAttribute('class', 'Streams_preview_loading');
		tool.element.innerHTML = '';
		tool.element.appendChild(img);
	},
	preview: function _preview() {
		var tool = this;
		var state = tool.state;
		Q.Streams.retainWith(tool).get(state.publisherId, state.streamName,
		function (err) {
			// handle error messages
			if (err) {
				state.onError.handle.call(tool, err);
				var fem = Q.firstErrorMessage(err);
				return console.warn("Streams/preview: " + fem);
			}
			// trigger the refresh when it's ready
			tool.stream = this;
			state.onRefresh.handle.call(tool, this);
			setTimeout(function () {
				tool.actions();
			}, 0);
		});
		Q.Streams.Stream.onFieldChanged(state.publisherId, state.streamName)
		.set(function (field) {
			tool.stream = this;
			tool.stateChanged('stream.'+field);
		}, tool);
	},
	icon: function _icon (element, onLoad) {
		var tool = this;
		var state = tool.state;
		Q.Streams.get(state.publisherId, state.streamName, function () {
			tool.stream = this;
			// icon and imagepicker
			var oss = state.overrideShowSize;
			var si = state.imagepicker;
			var sfi = this.fields.icon;
			var file = (oss && oss[this.fields.icon])
				|| si.saveSizeName[si.showSize]
				|| Q.first(si.saveSizeName, {nonEmptyKey: true});
			var full = si.saveSizeName[si.fullSize] || file;
			var icon = (sfi && sfi !== 'default') ? sfi : "default";
			// check if we should add the imagepicker
			var se = state.editable;
			if (element && se && se.indexOf('icon') < 0
			&& this.testWriteLevel('suggest')) {
				$(element).off('load.Streams-preview')
				.on('load.Streams-preview', function () {
					// add imagepicker
					var ipo = Q.extend({}, si, {
						preprocess: function (callback) {
							Q.Streams.get(state.publisherId, state.streamName,
							function (err) {
								if (err) {
									return console.warn(err);
								}
								var parts = stream.iconUrl(40).split('/');
								var iconUrl = parts.slice(0, parts.length-1).join('/')
									.substr(Q.info.baseUrl.length+1);
								var prefix = 'plugins/Users/img/icons'
								var path = (iconUrl.substr(0, prefix.length) === prefix)
									? prefix
									: 'uploads/streams';
								var subpath = iconUrl.substr(path.length+1);
								callback({ path: path, subpath: subpath });
							});
						},
						onSuccess: {'Streams/preview': function (data, key) {
							stream.refresh(null, {messages: true});
							return false;
						}}
					});
					$(this).plugin('Q/imagepicker', ipo, function () {
						Q.handle(onLoad, tool, [element]);
					});
				});
			}
			element.src = Q.url(
				Q.Streams.iconUrl(icon, file), null, 
				{cacheBust: state.cacheBustOnUpdate}
			);
			var parts = state.imagepicker.showSize.split('x');
			if (parts[0]) {
				element.width = parts[0] + 'px';
			}
			if (parts[1]) {
				element.height = parts[1] + 'px';
			}
		});
		return this;
	},
	actions: function _actions () {
		var tool = this;
		var state = tool.state;
		// check if we should add this behavior
		if (!state.actions
		|| state.removable === false
		|| !tool.stream.testWriteLevel('close')) {
			return false;
		}
		// add some actions
		var ao = Q.extend({}, state.actions, {
			actions: {
				'delete': tool.remove.bind(tool)
			}
		});
		tool.$().plugin('Q/actions', ao);
		return this;
	},
	remove: function _remove() {
		var tool = this;
		var state = tool.state;
		tool.stream.remove(function (err) {
			if (err) {
				alert(err);
				return;
			}
			state.onRemove.handle.call(tool);
		});
	},
	Q: {
		onLayout: new Q.Event(function () {
			var iconWidth = this.$('.Streams_preview_icon').outerWidth(true);
			this.$('.Streams_preview_title').width(
				$(this.element).innerWidth() - iconWidth
			);
		}, 'Streams/preview')
	}
}

);

Q.Template.set('Streams/preview/create',
	'<div class="Streams_preview_container Q_clearfix">'
	+ '<img src="{{& src}}" alt="{{alt}}" class="Streams_preview_add">'
	+ '<div class="Streams_preview_contents {{titleClass}}">'
	+ '<{{titleTag}} class="Streams_preview_title">{{title}}</{{titleTag}}>'
	+ '</div></div>'
);

})(Q, jQuery, window);