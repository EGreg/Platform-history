<?php

/**
 * Used to set the user's location from geolocation data.
 * @param $_REQUEST
 * @param [$_REQUEST.latitude] The new latitude. If set, must also specify longitude.
 * @param [$_REQUEST.longitude] The new longitude. If set, must also specify latitude.
 * @param [$_REQUEST.zipcode] The new zip code. Can be set instead of latitude, longitude.
 * @param [$_REQUEST.miles] The distance around their location around that the user is interested in
 * @param [$_REQUEST.subscribe] Whether to subscribe to all the local interests at the new location.
 * @param [$_REQUEST.unsubscribe] Whether to unsubscribe from all the local interests at the old location.
 * @param [$_REQUEST.accuracy]
 * @param [$_REQUEST.altitude]
 * @param [$_REQUEST.altitudeAccuracy]
 * @param [$_REQUEST.heading]
 * @param [$_REQUEST.speed]
 * @param [$_REQUEST.timezone]

 * @param [$_REQUEST.]
 * @param [$_REQUEST.]
 *
 * @throws Exception
 * @throws Q_Exception
 * @throws Q_Exception_MissingRow
 * @throws Q_Exception_Recursion
 * @throws Users_Exception_NotLoggedIn *
 */
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