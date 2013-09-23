<?php

/**
 * This tool renders a user avatar
 *
 * @param array $options
 * An associative array of parameters, containing:
 *   "user" => The user object. Defaults to the logged-in user, if any.
 *   "icon" => Optional. Render icon before the username.
 *   "editable" => Defaults to false. If true, the tool will allow editing of the user icon and name.
 */
function Users_avatar_tool($options)
{
	$defaults = array(
		'icon' => false,
		'editable' => false
	);
	$options = array_merge($defaults, $options);
	Q_Response::addStylesheet('plugins/Q/css/Ui.css');
	Q_Response::setToolOptions($options);
	$user = isset($options['user']) ? $options['user'] : Users::loggedInUser();
	if (!$user) {
		return '';
	}
	$p = $options;
	$p['user'] = $user->fields; // just to not have 'fields' in encoded json
	Q_Response::setToolOptions($p);
	$result = '';
	$icon = $options['icon'];
	if ($icon) {
		if ($icon === true) $icon = 40;
		$result .= Q_Html::img("plugins/Users/img/icons/{$user->icon}/$icon.png", 'user icon', array(
			'class' => 'Users_avatar_icon'
		));
	}
	$result .= '<span class="Users_avatar_name">' . $user->username . '</span>';
	return $result;
}
