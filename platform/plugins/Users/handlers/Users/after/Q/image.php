<?php

function Users_after_Q_image ($params) {
	extract($params);
	/**
	 * @var string $path
	 * @var Users_User $user
	 */
	if (substr($path, 0, 32) === "plugins/Users/img/icons/user-") {
		$user->icon = "user-{$user->id}";
		$user->save();
	}
	
}