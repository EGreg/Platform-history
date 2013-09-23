<?php

/**
 * Provide player content to create the stream
 * 
 **/

function Streams_post_response_player () {
	
	$user = Users::loggedInUser(true);
		
	$userId = $user->id;
	
	// need to know publisher and type of the streem to create
	$streamType = Streams::requestedType(true);
	$publisherId = Q_Config::expect('Streams', $streamType, 'publisher');
	
	// Let's be nice to poor Windows users
	$type = join(DS, explode('/', $streamType));
	
	$app = Q_Config::expect('Q', 'app');
	
	return Q::view("Streams/$type/post.php", compact('publisherId', 'streamType', 'userId', 'app'));
}