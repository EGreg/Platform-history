<?php

/**
 * This tool renders a user avatar
 *
 * @param array $options
 * An associative array of parameters, containing:
 *   "userId" => The user's id. Defaults to id of the logged-in user, if any.
 *   "icon" => Optional. Render icon before the display name. Can be true or a valid icon size: 40, 50 or 80.
 *   "short" => Optional. Renders the short version of the display name.
 *   "iconAttributes" => Optional. Array of attributes to render for the icon.
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
		$attributes = array(
			'class' => 'Users_avatar_icon'
		);
		$attributes = isset($options['iconAttributes'])
			? $options['iconAttributes']
			: array();
		$attributes['class'] = isset($attributes['class'])
			? $attributes['class'] . ' Users_avatar_icon'
			: 'Users_avatar_icon';
		$result .= Q_Html::img(
			"plugins/Users/img/icons/{$avatar->icon}/$icon.png", 
			'user icon', $attributes
		);
	}
	$o = $options['short'] ? array('short' => true) : array();
	$result .= '<span class="Users_avatar_name">' . $avatar->displayName($o) . '</span>';
	unset($options['iconAttributes']);
	Q_Response::setToolOptions($options);
	return $result;
}
