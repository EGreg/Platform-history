/**
 * Users/avatar tool
 * @param {String} prefix Prefix of the tool to be constructed.
 * @param {Object} options A hash of options, containing:
 *   "user": The user object. Defaults to the logged-in user, if any.
 *   "icon": Optional. Render icon before the username.
 *   "editable": Defaults to false. If true, the tool will allow editing of the user icon and name.
 */
Q.Tool.constructors['users_avatar'] = function(options)
{
	var toolDiv = $(this.element);
	if (options.editable && Q.Users.loggedInUser.id == options.user.id)
	{
		toolDiv.find('.Users_avatar_icon').plugin('Q/imagepicker', {
			'path': 'plugins/Users/img/icons',
			'subpath': 'user-' + Q.Users.loggedInUser.id,
			'saveSizeName': { '40': '40', '50': '50', '80': '80w' }
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
						Q.jsonRequest(Q.url('action.php/Streams/basic?') + params, 'data', function(err, res)
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
};