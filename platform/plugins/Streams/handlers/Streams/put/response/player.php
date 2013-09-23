<?php

/**
 * Provide player content to update the stream
 * 
 **/

function Streams_put_response_player () {
	
	$user = Users::loggedInUser(true);
		
	$userId = $user->id;
	
	$publisherId = Streams::requestedPublisherId(true);
	$name = Streams::requestedName(true);
	
	if (substr($name, -1) === '/')
		throw new Q_Exception("Player cannot update multiple streams", compact('publisherId', 'name'));

	/*
	 * Get shall return only streams which user is authorized to see.
	 */
	
	if (!($stream = Streams::get($userId, $publisherId, $name, null, true)))
		throw new Q_Exception_MissingRow(array('table' => 'stream', 'criteria' => compact('publisherId', 'name')));
	
	// Let's be nice to poor Windows users
	$type = join(DS, explode('/', $stream->type));
	
	return Q::view("Streams/$type/put.php", compact('stream', 'userId'));
}