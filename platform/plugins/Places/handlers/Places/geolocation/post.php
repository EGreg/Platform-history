<?php
	
function Places_geolocation_post()
{
	// TODO: update geolocation, and nearby zipcodes
	$user = Users::loggedInUser(true);
	$streamName = "Places/user/location";
	$stream = Streams::fetchOne($user->id, $user->id, $streamName);
	if (!$stream) {
		$stream = new Streams_Stream();
		$stream->publisherId = $user->id;
		$stream->name = $streamName;
		$stream->type = "Places/location";
		$stream->content = '';
		$stream->save();
	}
}