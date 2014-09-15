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
		$oldLatitude = $stream->getAttribute('latitude');
		$oldLongitude = $stream->getAttribute('longitude');
		$oldMiles = $stream->getAttribute('miles');
	} else {
		$stream = new Streams_Stream();
		$stream->publisherId = $user->id;
		$stream->name = $streamName;
		$stream->type = "Places/location";
		$stream->content = '';
	}
	$attributes = Q::take($_REQUEST, $fields);
	$stream->setAttribute($attributes);
	$stream->save();
	
	if (!empty($_REQUEST['unsubscribe']) and isset($oldMiles)) {
		$attributes['unsubscribed'] = Places::unsubscribe(
			$oldLongitude, $oldLongitude, $oldMiles
		);
	}
	
	if (!empty($_REQUEST['subscribe'])) {
		$latitude = $stream->getAttribute('latitude');
		$longitude = $stream->getAttribute('longitude');
		$miles = Q::ifset($attributes, 'miles', 
			$stream->getAttribute(
				'miles',
				Q_Config::expect('Places', 'nearby', 'defaultMiles')
			)
		);
		$attributes['subscribed'] = Places::subscribe(
			$latitude, $longitude, $miles
		);
	}
	
	$attributes['stream'] = $stream;
	
	Q::event("Places/geolocation", $attributes, 'after');
}