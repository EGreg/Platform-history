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
 * @param {Object} [options] this object contains function parameters
 *   @param {String} [options.userId] User Id for getting avatar
 *   @required
 *   @param {String} [options.icon] icon for avatar
 *   @default '40'
 *   @param {Object} [options.templates] Object for avatar template parameters
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
	if (this.element.childNodes.length) {
		return;
	}
	var tool = this, state = this.state;
	if (!state.userId) {
		console.warn("Users/avatar: no userId provided");
		return; // empty
	}
	if (state.icon === true) {
		state.icon = 50;
	}
	
	var p = new Q.Pipe(['icon', 'contents'], function (params) {
		tool.element.innerHTML = params.icon + params.contents;	
	});
	
	Q.Users.get(state.userId, function (err, user) {
		var fields;
		if (!user) return;
		state.user = user;
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
			name: this.username
		});
		Q.Template.render('Users/avatar/contents', fields, function (err, html) {
			p.fill('contents')(html);
		}, state.templates.contents);
	});
},

{
	user: null,
	icon: '40',
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
	}
}

);

Q.Template.set('Users/avatar/icon', '<img src="{{& src}}" alt="{{alt}}" class="Users_avatar_icon">');
Q.Template.set('Users/avatar/contents', '<{{tag}} class="Users_avatar_contents">{{name}}</{{tag}}>');

})(Q, jQuery, window);