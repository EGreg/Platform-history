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
		if ($user->icon != $subpath) {
			$user->icon = $subpath;
			$user->save(); // triggers any registered hooks
			Users::$cache['iconUrlWasChanged'] = true;
		} else {
			Users::$cache['iconUrlWasChanged'] = false;
		}
	}
}