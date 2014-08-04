<?php
	
function Places_geolocation_post()
{
	$user = Users::loggedInUser(true);
	$streamName = "Places/user/location";
	$stream = Streams::fetchOne($user->id, $user->id, $streamName);
	$fields = array(
		'accuracy',
		'altitude',
		'altitudeAccuracy',
		'heading',
		'latitude',
		'longitude',
		'speed'
	);
	if (!$stream) {
		$stream = new Streams_Stream();
		$stream->publisherId = $user->id;
		$stream->name = $streamName;
		$stream->type = "Places/location";
		$stream->content = '';
		foreach ($fields as $f) {
			if (isset($_REQUEST[$f])) {
				$stream->setAttribute($f, $_REQUEST[$f]);
			}
		}
		$stream->save();
	}
}