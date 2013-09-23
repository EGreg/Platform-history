<?php

function Users_login_response_data()
{
	$user = Users::loggedInUser();
	return array('user' => $user ? $user->exportArray() : null);
}