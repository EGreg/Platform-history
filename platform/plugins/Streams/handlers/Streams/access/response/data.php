<?php

function Streams_access_response_data()
{
	$user = Users::loggedInUser(true);
	$publisherId = Streams::requestedPublisherId(true);
	if ($publisherId != $user->id) {
		throw new Users_Exception_NotAuthorized();
	}
	return array('access' => Q::ifset(Streams::$cache, 'access', null));
}