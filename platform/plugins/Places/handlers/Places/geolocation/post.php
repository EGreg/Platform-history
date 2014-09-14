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
		'speed',
		'miles'
	);
	if ($stream) {
		$latitude = $stream->getAttribute('latitude');
		$longitude = $stream->getAttribute('longitude');
	} else {
		$stream = new Streams_Stream();
		$stream->publisherId = $user->id;
		$stream->name = $streamName;
		$stream->type = "Places/location";
		$stream->content = '';
		$latitude = null;
	}
	$attributes = Q::take($_REQUEST, $fields);
	$stream->setAttribute($attributes);
	$stream->save();
	
	$miles = Q::ifset($attributes, 'miles', 
		Q_Config::expect('Places', 'nearby', 'defaultMiles')
	);
	
	if (!empty($_REQUEST['unsubscribe']) and isset($latitude)) {
		$attributes['unsubscribed'] = Places::unsubscribe($latitude, $longitude, $miles);
	}
	
	if (!empty($_REQUEST['subscribe'])) {
		$latitude = $stream->getAttribute('latitude');
		$longitude = $stream->getAttribute('longitude');
		$attributes['subscribed'] = Places::subscribe($latitude, $longitude, $miles);
	}
	
	$attributes['stream'] = $stream;
	
	Q::event("Places/geolocation", $attributes, 'after');
}