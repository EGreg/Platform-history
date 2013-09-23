<?php

function Streams_stream_response_column1()
{
	$publisherId = Streams::requestedPublisherId(true);
	$name = Streams::requestedName(true);
	$fields = Streams::requestedFields();
	
	$user = Users::loggedInUser();
	
	if (isset(Streams::$cache['stream'])) {
		$stream = Streams::$cache['stream'];
	} else {
		$streams = Streams::fetch(
			$user ? $user->id : 0,
			$publisherId,
			$name,
			$fields,
			array('limit' => 30)
		);
		if (empty($streams)) {
			throw new Q_Exception("No such stream", 'name');
		}
		$stream = reset($streams);
	}

	// check if it is invited user
	$token = Q_Request::special('token', null);
	$invite = Streams_Invite::fromToken($token);
	if ($invite) {
		$by_user = Users_User::getUser($invite->invitingUserId);
		$by_display_name = $invite->displayName;
		if (empty($by_display_name)) {
			$by_display_name = Streams::displayName($by_user->id);
		}
		Q_Session::setNonce();
		return Q::view('Streams/content/register.php', compact('token', 'by_user', 'by_display_name', 'stream', 'user'));
	}
	
	if (isset($user)) {
		// is this where we have the autojoin?
		$stream->join();
	}

	// show stream as usual
	return Q::view('Streams/content/stream.php', compact(
		'publisherId', 'name', 'fields',
		'user', 'stream'
	));
}
