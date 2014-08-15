<?php

/**
 * This tool renders a user avatar
 *
 * @param array $options
 * An associative array of parameters, containing:
 *   "userId" => The user's id. Defaults to id of the logged-in user, if any.
 *   "icon" => Optional. Render icon before the display name. Can be true or a valid icon size: 40, 50 or 80.
 *   "short" => Optional. Renders the short version of the display name.
 */
function Users_avatar_tool($options)
{
	$defaults = array(
		'icon' => false,
		'short' => false
	);
	$options = array_merge($defaults, $options);
	Q_Response::addStylesheet('plugins/Users/css/Users.css');
	$loggedInUser = Users::loggedInUser();
	$loggedInUserId = $loggedInUser ? $loggedInUser->id : "";
	if (empty($options['userId'])) {
		$options['userId'] = $loggedInUserId;
	}
	$avatar = Streams_Avatar::fetch($loggedInUserId, $options['userId']);
	if (!$avatar) {
		return '';
	}
	$result = '';
	if ($icon = $options['icon']) {
		if ($icon === true) $icon = 40;
		$result .= Q_Html::img("plugins/Users/img/icons/{$avatar->icon}/$icon.png", 'user icon', array(
			'class' => 'Users_avatar_icon'
		));
	}
	$o = $options['short'] ? array('short' => true) : array();
	$result .= '<span class="Users_avatar_name">' . $avatar->displayName($o) . '</span>';
	Q_Response::setToolOptions($options);
	return $result;
}
