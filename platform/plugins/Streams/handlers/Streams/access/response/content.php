<?php

function Streams_access_response_content()
{
	$user = Users::loggedInUser(true);
	$streamName = Streams::requestedName(true);
	$stream = new Streams_Stream();
	$stream->publisherId = $user->id;
	$stream->name = $streamName;
	if (!$stream->retrieve()) {
		throw new Q_Exception_MissingRow(array('table' => 'stream', 'criteria' => 'that name'), 'name');
	}
	
	Q_Response::setSlot('title', "Access to: " . $stream->title);
	return Q::tool('Streams/access', compact(
		'streamName'
	));
}