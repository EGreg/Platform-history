/**
 * Users/avatar tool
 * @param {String} prefix Prefix of the tool to be constructed.
 * @param {Object} options A hash of options, containing:
 *   "user": The user object. Defaults to the logged-in user, if any.
 *   "icon": Optional. Render icon before the display name.
 *   "short": Optional. Renders the short version of the display name.
 *   "editable": Defaults to false. If true, the tool will allow editing of the user icon and name.
 */
Q.Tool.define("Users/avatar", function(options) {
	var o = Q.extend(Q.Tool.constructors['users_avatar'].options, options);
	var toolDiv = $(this.element);
	if (toolDiv.children().length == 0)
	{
		var pipe = new Q.Pipe(['firstName', 'lastName'], function(params, subjects)
		{
			if (o.icon)
			{
				var src = Q.url('plugins/Users/img/icons/user-' + Q.Users.loggedInUser.id + '/' + o.icon + '.png');
				toolDiv.append('<img class="Users_avatar_icon" src="' + src + '" alt="" />');
			}
			
			var first = '', last = '';
			if (subjects.firstName && subjects.firstName.fields)
			{
				first = subjects.firstName.fields.content;
			}
			if (subjects.lastName && subjects.lastName.fields)
			{
				last = subjects.lastName.fields.content;
			}
			toolDiv.append('<span class="Users_avatar_name">' + first + (!o['short'] && last ? ' ' + last : '') + '</span>');
			
			makeEditableIfNeeded();
			
			Q.jsonRequest.options.quiet = false;
			
			Q.handle(o.onNameResolve);
		});
		Q.jsonRequest.options.quiet = true;
		Q.Streams.get(o.user.id, 'Streams/user/firstName', pipe.fill('firstName'));
		Q.Streams.get(o.user.id, 'Streams/user/lastName', pipe.fill('lastName'));
	}
	else
	{
		makeEditableIfNeeded();
	}
	
	function makeEditableIfNeeded()
	{
		if (o.editable && Q.Users.loggedInUser.id == o.user.id)
		{
			toolDiv.find('.Users_avatar_icon').plugin('Q/imagepicker', {
				'path': 'plugins/Users/img/icons',
				'subpath': 'user-' + Q.Users.loggedInUser.id,
				'saveSizeName': { '40': '40', '50': '50', '80': '80w' },
				'showSize': '40'
			});
			var userName = toolDiv.find('.Users_avatar_name');
			var userNameInput = $('<input type="text" name="name_edit" class="Users_avatar_name_edit" />').val(userName.text()).hide();
			userNameInput.css({
				'font-size': userName.css('font-size'),
				'font-familty': userName.css('font-family'),
				'font-weight': userName.css('font-weight'),
				'font-style': userName.css('font-style')
			});
			userName.after(userNameInput);
			userNameInput.validator();
			userName.on(Q.Pointer.end, function()
			{
				userName.hide();
				userNameInput.show().focus();
				userNameInput.on('blur.Users_avatar', function()
				{
					if (userNameInput.val() != userName.text() && confirm('Save changes?'))
					{
						$(this).trigger('keyup', 'save');
					}
					else
					{
						userNameInput.data('validator').reset();
						userNameInput.off('blur.Users_avatar keyup.Users_avatar').val(userName.text()).hide();
						userName.show();
					}
				});
				userNameInput.on('keyup.Users_avatar', function(e, shouldSave)
				{
					if (shouldSave === 'save' || e.keyCode == 13)
					{
						var fullname = userNameInput.val();
						if (fullname.length > 0)
						{
							userNameInput.data('validator').reset();
							var params = $.param({ 'fullname': fullname });
							Q.jsonRequest(Q.url('action.php/Streams/basic?') + params, 'data', function(res)
							{
								if (res.errors)
								{
									alert(res.errors[0].message);
								}
								else
								{
									userNameInput.off('blur.Users_avatar keyup.Users_avatar').trigger('blur').hide();
									userName.html(userNameInput.val()).show();
								}
							}, { 'method': 'post' });
						}
						else
						{
							userNameInput.data('validator').invalidate({ 'name_edit': 'User name cannot be empty' });
						}
					}
				});
			});
		}
	}
},

{
	'user': Q.Users.loggedInUser,
	'icon': '40',
	'short': false,
	'editable': false,
	'onNameResolve': new Q.Event(function() {}, 'Users.avatar.onNameResolve')
}

);