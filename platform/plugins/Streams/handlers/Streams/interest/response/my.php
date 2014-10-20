<?php

/**
 * Get an accelerated version of streams related to the logged-in user's
 * "Streams/user/interests" stream
 */
function Streams_interest_response_my()
{
	$user = Users::loggedInUser(true);
	
	return Streams_Category::getRelatedTo(
		$user->id, 'Streams/user/interests', 'Streams/interest'
	);
}