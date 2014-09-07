<?php

function Users_after_Q_image ($params, &$return) {
	extract($params);
	/**
	 * @var string $path
	 * @var string $subpath
	 * @var Users_User $user
	 */
	$fullpath = $path.($subpath ? DS.$subpath : '');
	$prefix = "plugins/Users/img/icons/user-{$user->id}";
	if (substr($fullpath, 0, strlen($prefix)) === $prefix) {
		$user->icon = "user-{$user->id}";
		$user->save();
		Users::$cache['iconWasChanged'] = true;
	}
	
}