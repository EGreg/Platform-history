<?php
	
function Places_geolocation_post()
{
	$stream = Places::userLocationStream();
	$oldLatitude = $stream->getAttribute('latitude');
	$oldLongitude = $stream->getAttribute('longitude');
	$oldMiles = $stream->getAttribute('miles');
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
	$attributes = Q::take($_REQUEST, $fields);
	$stream->setAttribute($attributes);
	$stream->save();
	
	if (!empty($_REQUEST['unsubscribe']) and isset($oldMiles)) {
		$attributes['unsubscribed'] = Places::unsubscribe(
			$oldLatitude, $oldLongitude, $oldMiles
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