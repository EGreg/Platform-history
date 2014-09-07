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
 *   @param {String} [options.userId] The id of the user object.
 *   @required
 *   @param {Number} [options.icon] Size of the icon to render before the display name.
 *   @default 40
 *   @param {Boolean} [options.short] If true, renders the short version of the display name.
 *   @default false
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
 */
Q.Tool.define("Users/avatar", function(options) {
	var tool = this, state = this.state;
	if (tool.element.childNodes.length) {
		return _present();
	}
	if (!state.userId) {
		console.warn("Users/avatar: no userId provided");
		return; // empty
	}
	if (state.icon === true) {
		state.icon = 50;
	}
	
	var p = new Q.Pipe(['icon', 'contents'], function (params) {
		tool.element.innerHTML = params.icon + params.contents;	
		_present();
	});
	
	Q.Streams.Avatar.get(state.userId, function (err, avatar) {
		var fields;
		if (!avatar) return;
		state.avatar = avatar;
		if (state.icon) {
			fields = Q.extend({}, state.templates.icon.fields, {
				src: Q.Users.iconUrl(this.icon, state.icon)
			});
			Q.Template.render('Users/avatar/icon', fields, function (err, html) {
				p.fill('icon')(html);
			}, state.templates.icon);
		} else {
			p.fill('icon')('');
		}

		fields = Q.extend({}, state.templates.contents.fields, {
			name: this.displayName({
				"short": state["short"]
			})
		});
		Q.Template.render('Users/avatar/contents', fields, function (err, html) {
			p.fill('contents')(html);
		}, state.templates.contents);
	});
	
	function _present() {
		if (!state.editable) return;
		
		Q.each(['first', 'last'], function (k, v) {
			var vName = v+'Name';
			var f = tool.getElementsByClassName('Streams_'+vName)[0];
			var e = Q.Tool.setUpElement('span', 'Streams/inplace', {
				publisherId: state.userId,
				streamName: 'Streams/user/'+vName,
				placeholder: 'Your '+v+' name',
				inplaceType: 'text',
				inplace: {
					bringToFront: f
				}
			}, vName, tool.prefix);
			f.innerHTML = '';
			f.appendChild(e);
			Q.activate(e);
		});
		var $img = tool.$('.Users_avatar_icon');
		var saveSizeName = {};
		Q.each(Q.Users.icon.sizes, function (k, v) {
			saveSizeName[v] = v+".png";
		});
		var o = Q.extend({
			saveSizeName: saveSizeName,
			showSize: $img.width()
		}, state.imagepicker);
		$img.plugin('Q/imagepicker', o);
	}
},

{
	user: null,
	icon: '40',
	"short": false,
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
	imagepicker: {}
}

);

Q.Template.set('Users/avatar/icon', '<img src="{{& src}}" alt="{{alt}}" class="Users_avatar_icon">');
Q.Template.set('Users/avatar/contents', '<{{tag}} class="Users_avatar_contents">{{name}}</{{tag}}>');

})(Q, jQuery, window);