(function (Q, $, window, undefined) {

/**
 * Users Tools
 * @module Users-tools
 * @main
 */

/**
 * Avatar representing a user
 * @class Users avatar
 * @constructor
 * @param {String} prefix Prefix of the tool to be constructed.
 * @param {Object} [options] A hash of options, containing:
 *   @param {String} [options.userId] The id of the user object. Can be '' for a blank-looking avatar.
 *   @required
 *   @param {Number} [options.icon] Size of the icon to render before the display name.
 *   @default 40
 *   @param {Boolean} [options.short] If true, renders the short version of the display name.
 *   @default false
 *   @param {Boolean|Array} [options.editable] If true, and userId is the logged-in user's id, the tool presents an interface for the logged-in user to edit their name and icon. This can also be an array containing one or more of ['icon','name'].
 *   @default true
 *   @param {Boolean} [options.reflectChanges] Whether the tool should update its contents on changes
 *   @default true
 *   @param {Number} [options.cacheBust=1000] Number of milliseconds to use for combating unintended caching on some environments.
 *   @default true
 *   @param {Object} [options.templates]
 *     @param {Object} [options.templates.icon]
 *       @param {String} [options.templates.icon.dir]
 *       @default 'plugins/Users/views'
 *       @param {String} [options.templates.icon.name]
 *       @default 'Users/avatar/icon'
 *       @param {Object} [options.templates.icon.fields]
 *         @param {String} [options.templates.icon.fields.alt]
 *         @default "user icon"
 *     @param {Object} [options.templates.contents]
 *       @param {String} [options.templates.contents.dir]
 *       @default 'plugins/Users/views'
 *       @param {String} [options.templates.contents.name]
 *       @default 'Users/avatar/contents'
 *       @param {Object} [options.templates.contents.fields]
 *         @param {String} [options.templates.contents.fields.tag]
 *         @default "span"
 *   @param {Q.Event} [options.onRefresh]  An event that occurs when the avatar is refreshed
 *   @param {Q.Event} [options.onUpdate]  An event that occurs when the icon is updated via this tool
 *   @param {Q.Event} [options.onImagepicker]  An event that occurs when the imagepicker is activated
 */
Q.Tool.define("Users/avatar", function(options) {
	var tool = this, state = this.state;
	Q.Streams.Stream.retain(state.userId, 'Streams/user/firstName', tool);
	Q.Streams.Stream.retain(state.userId, 'Streams/user/lastName', tool);
	this.refresh();
	if (!state.reflectChanges) {
		return;
	}
	Q.Streams.Stream.onFieldChanged(state.userId, 'Streams/user/icon', 'icon')
	.set(function (fields, field) {
		tool.$('.Users_avatar_icon').attr('src', 
			Q.url(Q.Users.iconUrl(fields.icon, state.icon), null,
				{cacheBust: state.cacheBust})
		);
	}, this);
	if (!state.editable || state.editable.indexOf('name') < 0) {
		Q.Streams.Stream.onFieldChanged(state.userId, 'Streams/user/firstName', 'content')
		.set(handleChange, this);
		Q.Streams.Stream.onFieldChanged(state.userId, 'Streams/user/lastName', 'content')
		.set(handleChange, this);
	}
	function handleChange(fields, field) {
		Q.Streams.Avatar.get.forget(state.userId);
		tool.element.innerHTML = '';
		tool.refresh();
	}
},

{
	userId: null,
	icon: '40',
	"short": false,
	reflectChanges: true,
	templates: {
		icon: {
			dir: 'plugins/Users/views',
			name: 'Users/avatar/icon',
			fields: { alt: "user icon" }
		},
		contents: {
			dir: 'plugins/Users/views',
			name: 'Users/avatar/contents',
			fields: { tag: "span" }
		}
	},
	editable: false,
	imagepicker: {},
	cacheBust: 1000,
	onRefresh: new Q.Event(),
	onUpdate: new Q.Event(),
	onImagepicker: new Q.Event()
},

{
	/**
	 * Refresh the avatar's display
	 * @method refresh
	 */
	refresh: function () {
		
		var tool = this, state = this.state;
		if (tool.element.childNodes.length) {
			return _present();
		}
		
		// TODO: implement analogous functionality
		// to when Users/avatar is rendered server-side,
		// with "editable" and the same <span> elements
		// for firstName and lastName.
		
		if (state.userId === undefined) {
			console.warn("Users/avatar: no userId provided");
			return; // empty
		}
		if (state.icon === true) {
			state.icon = 50;
		}
	
		var p = new Q.Pipe(['icon', 'contents'], function (params) {
			tool.element.innerHTML = params.icon[0] + params.contents[0];
			_present();
		});
		
		if (state.userId === '') {
			var fields = Q.extend({}, state.templates.contents.fields, {
				name: ''
			});
			Q.Template.render('Users/avatar/icon/blank', fields, function (err, html) {
				p.fill('icon')(html);
			});
			Q.Template.render('Users/avatar/contents/blank', fields, function (err, html) {
				p.fill('contents')(html);
			});
			return;
		}
		
		Q.Streams.Avatar.get(state.userId, function (err, avatar) {
			var fields;
			if (!avatar) return;
			state.avatar = avatar;
			if (state.icon) {
				fields = Q.extend({}, state.templates.icon.fields, {
					src: Q.url(Q.Users.iconUrl(this.icon, state.icon), null,
						{cacheBust: state.cacheBust})
				});
				Q.Template.render('Users/avatar/icon', fields, 
				function (err, html) {
					p.fill('icon')(html);
				}, state.templates.icon);
			} else {
				p.fill('icon')('');
			}

			fields = Q.extend({}, state.templates.contents.fields, {
				name: this.displayName({
					"short": state["short"],
					"html": true
				})
			});
			if (fields.name) {
				Q.Template.render('Users/avatar/contents', fields,
				function (err, html) {
					p.fill('contents')(html);
				}, state.templates.contents);
			} else {
				Q.Template.render('Users/avatar/contents/blank', fields,
				function (err, html) {
					p.fill('contents')(html);
				});
			}
		});
	
		function _present() {
			Q.handle(state.onRefresh, tool, []);
			if (!state.editable) return;
			if (state.editable === true) {
				state.editable = ['icon', 'name'];
			}
			if (state.editable.indexOf('name') >= 0) {
				Q.each(['first', 'last'], function (k, v) {
					var vName = v+'Name';
					var f = tool.getElementsByClassName('Streams_'+vName)[0];
					if (!f || f.getElementsByClassName('Streams_inplace_tool').length) {
						return;
					}
					var e = Q.Tool.setUpElement('span', 'Streams/inplace', {
						publisherId: state.userId,
						streamName: 'Streams/user/'+vName,
						inplaceType: 'text',
						inplace: {
							bringToFront: f,
							placeholder: 'Your '+v+' name',
							staticHtml: f.innerHTML
						}
					}, tool.prefix+vName, tool.prefix);
					f.innerHTML = '';
					f.appendChild(e);
					Q.activate(e);
				});
			}
			if (state.editable.indexOf('icon') >= 0) {
				var $img = tool.$('.Users_avatar_icon');
				var saveSizeName = {};
				Q.each(Q.Users.icon.sizes, function (k, v) {
					saveSizeName[v] = v+".png";
				});
				Q.Streams.retainWith(tool).get(
					Q.Users.loggedInUser.id,
					'Streams/user/icon',
					function (err) {
						var stream = this;
						var o = Q.extend({
							saveSizeName: saveSizeName,
							showSize: $img.width(),
							path: 'plugins/Users/img/icons',
							subpath: 'user-'+state.userId,
							onSuccess: {"Users/avatar": function () {
								stream.refresh(function () {
									state.onUpdate.handle.call(tool, this);
								}, {
									unlessSocket: true,
									changed: { icon: true }
								});
							}}
						}, state.imagepicker);
						$img.plugin('Q/imagepicker', o, function () {
							state.onImagepicker.handle($img.state('Q/imagepicker'));
						});
					}
				)
			}
		}
	}
}

);

Q.Template.set('Users/avatar/icon', '<img src="{{& src}}" alt="{{alt}}" class="Users_avatar_icon">');
Q.Template.set('Users/avatar/contents', '<{{tag}} class="Users_avatar_name">{{& name}}</{{tag}}>');
Q.Template.set('Users/avatar/icon/blank', '<div class="Users_avatar_icon Users_avatar_icon_blank"></div>');
Q.Template.set('Users/avatar/contents/blank', '<div class="Users_avatar_name Users_avatar_name_blank">&nbsp;</div>');

})(Q, jQuery, window);