(function (Q, $, window, undefined) {

/**
 * Users/avatar tool
 * @param {String} prefix Prefix of the tool to be constructed.
 * @param {Object} options A hash of options, containing:
 *   "userId": The id of the user object. Required.
 *   "icon": Optional. Size of the icon to render before the display name.
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
	onName: new Q.Event(function() {}, 'Users'),
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

})(window.jQuery, window);