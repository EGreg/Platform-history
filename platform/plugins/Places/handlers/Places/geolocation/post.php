<?php
	
function Places_geolocation_post()
{
	$user = Users::loggedInUser(true);
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
		'miles',
		'zipcode',
		'timezone'
	);
	$attributes = Q::take($_REQUEST, $fields);
	if (isset($attributes['latitude'])
	xor isset($attributes['longitude'])) {
		throw new Q_Exception(
			"When specifying latitude,longitude you must specify both",
			array('latitude', 'longitude')
		);
	}
	if (!empty($attributes['zipcode'])
	and !isset($attributes['latitude'])) {
		$z = new Places_Zipcode();
		$z->countryCode = 'US';
		$z->zipcode = $attributes['zipcode'];
		if ($z->retrieve()) {
			$attributes['latitude'] = $z->latitude;
			$attributes['longitude'] = $z->longitude;
		} else {
			throw new Q_Exception_MissingRow(array(
				'table' => 'zipcode',
				'criteria' => $attributes['zipcode']
			), 'zipcode');
		}
	}
	$attributes['miles'] = Q::ifset($attributes, 'miles', 
		$stream->getAttribute(
			'miles',
			Q_Config::expect('Places', 'nearby', 'defaultMiles')
		)
	);
	if (empty($attributes['zipcode'])
	and isset($attributes['latitude'])) {
		$zipcodes = Places_Zipcode::nearby(
			$attributes['latitude'],
			$attributes['longitude'],
			$attributes['miles'],
			1
		);
		$zipcode = $zipcodes ? reset($zipcodes) : null;
		$attributes['zipcode'] = $zipcode->zipcode;
		$attributes['placeName'] = $zipcode->placeName;
		$attributes['state'] = $zipcode->state;
	}
	$stream->setAttribute($attributes);
	$stream->save();
	$stream->post($user->id, array(
		'type' => 'Places/location/updated',
		'content' => '',
		'instructions' => $stream->getAllAttributes()
	), true);
	
	if (!empty($_REQUEST['unsubscribe']) and isset($oldMiles)) {
		$attributes['unsubscribed'] = Places::unsubscribe(
			$oldLatitude, $oldLongitude, $oldMiles
		);
	}
	
	if (!empty($_REQUEST['subscribe'])) {
		$latitude = $stream->getAttribute('latitude');
		$longitude = $stream->getAttribute('longitude');
		$miles = $stream->getAttribute('miles');
		$attributes['subscribed'] = Places::subscribe(
			$latitude, $longitude, $miles
		);
	}
	
	$attributes['stream'] = $stream;
	
	Q_Response::setSlot('attributes', $attributes);
	Q::event("Places/geolocation", $attributes, 'after');
}