<?php

function Users_login_response_data()
{
	$user = Users::loggedInUser();
	if (!$user) {
		return array('user' => null);
	}
	$u = $user->exportArray();
	$u['displayName'] = Streams::displayName($user);
	return array('user' => $u);
}