<?php

function Users_authenticate_post()
{
	// Authenticate the logged-in user with the provider via the app
	// It will try to set an email address for the user if one isn't set yet
	$user = Users::authenticate('facebook', null, $authenticated, true);
	Users::setLoggedInUser($user);
}
