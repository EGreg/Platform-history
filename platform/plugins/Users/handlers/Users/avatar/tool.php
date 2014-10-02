<?php

/**
 * This tool renders a user avatar
 *
 * @param array $options
 * An associative array of parameters, containing:
 *   "userId" => The user's id. Defaults to id of the logged-in user, if any.
 *   "icon" => Optional. Render icon before the username.
 *   "iconAttributes" => Optional. Array of attributes to render for the icon.
 *   "editable" => Optional. Whether to provide an interface for editing the user's info. Can be array containing "icon", "name".
 */
function Users_avatar_tool($options)
{
	$defaults = array(
		'icon' => false,
		'editable' => false
	);
	$options = array_merge($defaults, $options);
	if (empty($options['userId'])) {
		$user = Users::loggedInUser();
		$options['userId'] = $user->id;
	} else {
		$user = Users_User::getUser($options['userId']);
	}
	$user = !empty($options['userId'])
		? Users_User::getUser($options['userId'])
		: Users::loggedInUser();
	
	Q_Response::addStylesheet('plugins/Q/css/Ui.css');
	Q_Response::setToolOptions($options);
	if (!$user) {
		return '';
	}
	$user->addPreloaded();
	$p = $options;
	$p['userId'] = $user->id;
	Q_Response::setToolOptions($p);
	$result = '';
	$icon = $options['icon'];
	if ($icon) {
		if ($icon === true) $icon = 40;
		$path = $user->iconPath();
		$attributes = isset($options['iconAttributes'])
			? $options['iconAttributes']
			: array();
		$attributes['class'] = isset($attributes['class'])
			? $attributes['class'] . ' Users_avatar_icon'
			: 'Users_avatar_icon';
		$result .= Q_Html::img("$path/$icon.png", 'user icon', $attributes);
	}
	$result .= '<span class="Users_avatar_name">' . $user->username . '</span>';
	return $result;
}
