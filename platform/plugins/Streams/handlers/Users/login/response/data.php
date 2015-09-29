<?php

function Users_login_response_data()
{
	$user = $roles = null;
	if ($row = Users::loggedInUser()) {
		$user = $row->exportArray();
		$user['displayName'] = Streams::displayName($row);
		$roles = Users::roles();
	}
	return compact('user', 'roles');
}