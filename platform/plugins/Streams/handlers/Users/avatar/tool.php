<?php

/**
 * This tool renders a user avatar
 *
 * @param array $options
 * An associative array of parameters, containing:
 *   "userId" => The user's id. Defaults to id of the logged-in user, if any.
 *   "icon" => Optional. Render icon before the display name. Can be true or a valid icon size: 40, 50 or 80.
 *   "iconAttributes" => Optional. Array of attributes to render for the icon.
 *   "short" => Optional. Renders the short version of the display name.
 *   "editable" => Optional. Whether to provide an interface for editing the user's info. Can be array containing "icon", "name".
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
		if ($icon === true) {
			$icon = Q_Config::get('Users', 'icon', 'defaultSize', 40);
		}
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
	$o['spans'] = true;
	$displayName = $avatar->displayName($o);
	$result .= "<span class='Users_avatar_name'>$displayName</span>";
	unset($options['iconAttributes']);
	if (is_string($options['editable'])) {
		$options['editable'] = array($options['editable']);
	}
	Q_Response::setToolOptions($options);
	return $result;
}
