<?php

function Users_after_Q_image_save($params, &$return)
{
	extract($params);
	/**
	 * @var string $path
	 * @var string $subpath
	 * @var Users_User $user
	 */
	$user = Users::loggedInUser(true);
	$fullpath = $path.($subpath ? DS.$subpath : '');
	$prefix = "plugins/Users/img/icons/user-{$user->id}";
	if (substr($fullpath, 0, strlen($prefix)) === $prefix) {
		$filename = "user-{$user->id}";
		if ($user->icon != $filename) {
			$user->icon = $filename;
			$user->save();
			Users::$cache['iconWasChanged'] = true;
		} else {
			Users::$cache['iconWasChanged'] = false;
		}
	}
}