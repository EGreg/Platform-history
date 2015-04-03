<?php
/**
 * Places model
 * @module Places
 * @main Places
 */
/**
 * Static methods for the Places models.
 * @class Places
 * @extends Base_Places
 */
abstract class Places extends Base_Places
{
	/*
	 * This is where you would place all the static methods for the models,
	 * the ones that don't strongly pertain to a particular row or table.
	 
	 * * * */

	/* * * */
	
	/**
	 * Get the logged-in user's location stream
	 * @method userLocationStream
	 * @param {boolean} [$throwIfNotLoggedIn=false]
	 *   Whether to throw a Users_Exception_NotLoggedIn if no user is logged in.
	 * @return {Streams_Stream|null}
	 * @throws {Users_Exception_NotLoggedIn} If user is not logged in and
	 *   $throwIfNotLoggedIn is true
	 */
	static function userLocationStream($throwIfNotLoggedIn = false)
	{
		$user = Users::loggedInUser($throwIfNotLoggedIn);
		if (!$user) {
			return null;
		}
		$streamName = "Places/user/location";
		$stream = Streams::fetchOne($user->id, $user->id, $streamName);
		if (!$stream) {
			$stream = new Streams_Stream();
			$stream->publisherId = $user->id;
			$stream->name = $streamName;
			$stream->type = "Places/location";
			$stream->title = "User location";
			$stream->save();
			$stream->join();
		}
		return $stream;
	}
	
	/**
	 * Get location stream of a publisher
	 * @method locationStream
	 * @static
	 * @param {string} $publisherId
	 * @param {string} $placeId
	 * @param {boolean} $throwIfBadValue
	 *  Whether to throw Q_Exception if the result contains a bad value
	 * @return {Streams_Stream|null}
	 * @throws {Q_Exception} if a bad value is encountered and $throwIfBadValue is true
	 */
	static function locationStream($publisherId, $placeId, $throwIfBadValue = false)
	{
		if (empty($placeId)) {
			if ($throwIfBadValue) {
				throw new Q_Exception_RequiredField(array('field' => 'id'));
			}
			return null;
		}
		
		// sanitize the ID
		$characters = '/[^A-Za-z0-9]+/';
		$result = preg_replace($characters, '_', $placeId);
		
		// see if it's already in the system
		$location = new Streams_Stream();
		$location->publisherId = $publisherId;
		$location->name = "Places/location/$placeId";
		if ($location->retrieve()) {
			$ut = $location->updatedTime;
			if (isset($ut)) {
				$db = $location->db();
				$ut = $db->fromDateTime($ut);
				$ct = $db->getCurrentTimestamp();
				$cd = Q_Config::get('Places', 'cache', 'duration', 60*60*24*30);
				if ($ct - $ut < $cd) {
					// there is a cached location stream that is still viable
					return $location;
				}
			}
		}
		
		$key = Q_Config::expect('Places', 'google', 'keys', 'server');
		$placeid = $placeId;
		$query = http_build_query(compact('key', 'placeid'));
		$url = "https://maps.googleapis.com/maps/api/place/details/json?$query";
		$ch = curl_init();
		curl_setopt($ch, CURLOPT_URL, $url);
		curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
		$json = curl_exec($ch);
		curl_close($ch);
		$response = json_decode($json, true);
		if (empty($response['result'])) {
			throw new Q_Exception("Places::locationStream: Couldn't obtain place information for $placeId");
		}
		if (!empty($response['error_message'])) {
			throw new Q_Exception("Places::locationStream: ".$response['error_message']);
		}
		$result = $response['result'];
		$attributes = array(
			'name' => $result['name'],
			'latitude' => $result['geometry']['location']['lat'],
			'longitude' => $result['geometry']['location']['lng'],
			// 'icon' => $result['icon'],
			'phoneNumber' => Q::ifset($result, 'international_phone_number', null),
			'phoneFormatted' => Q::ifset($result, 'formatted_phone_number', null),
			'rating' => Q::ifset($result, 'rating', null),
			'address' => Q::ifset($result, 'formatted_address', null)
		);
		$location->setAttribute($attributes);
		$location->type = 'Places/location';
		$location->save();
		return $location;
	}
	
	/**
	 * Get autocomplete results
	 * @method autocomplete
	 * @static
	 * @param {string} $input The text (typically typed by a user) to find completions for
	 * @param {boolean} [$throwIfBadValue=false]
	 *  Whether to throw Q_Exception if the result contains a bad value
	 * @param {array} [$types=array("establishment")] Can include "establishment", "locality", "sublocality", "postal_code", "country", "administrative_area_level_1", "administrative_area_level_2". Set to true to include all types.
	 * @param {double} [$latitude=userLocation] Override the latitude of the coordinates to search around
	 * @param {double} [$longitude=userLocation] Override the longitude of the coordinates to search around
 	 * @param {double} [$miles=25] Override the radius, in miles, to search around
	 * @return {Streams_Stream|null}
	 * @throws {Q_Exception} if a bad value is encountered and $throwIfBadValue is true
	 */
	static function autocomplete(
		$input, 
		$throwIfBadValue = false,
		$types = null, 
		$latitude = null, 
		$longitude = null,
		$miles = 25)
	{
		$supportedTypes = array("establishment", "locality", "sublocality", "postal_code", "country", "administrative_area_level_1", "administrative_area_level_2");
		$input = strtolower($input);
		if (is_string($types)) {
			$types = explode(',', $types);
		} else if ($types === true) {
			$types = null;
		}
		if ($types) {
			foreach ($types as $type) {
				if (!in_array($type, $supportedTypes)) {
					throw new Q_Exception_BadValue(array(
						'internal' => '$types',
						'problem' => "$type is not supported"
					));
				}
			}
		}
		if (empty($input)) {
			if ($throwIfBadValue) {
				throw new Q_Exception_RequiredField(array('field' => 'input'));
			}
			return null;
		}
		
		if (!isset($latitude) or !isset($longitude)) {
			if ($uls = Places::userLocationStream()) {
				$latitude = $uls->getAttribute('latitude', null);
				$longitude = $uls->getAttribute('longitude', null);
				if (!isset($miles)) {
					$miles = $uls->getAttribute('miles', 25);
				}
			} else {
				// put some defaults
				$latitude = 40.5806032;
				$longitude = -73.9755244;
				$miles = 25;
			}
		}

		$pa = null;
		if (class_exists('Places_Autocomplete')) {
			$pa = new Places_Autocomplete();
			$pa->query = $input;
			$pa->types = $types ? implode(',', $types) : '';
			$pa->latitude = $latitude;
			$pa->longitude = $longitude;
			$pa->miles = $miles;
			if ($pa->retrieve()) {
				$ut = $pa->updatedTime;
				if (isset($ut)) {
					$db = $pa->db();
					$ut = $db->fromDateTime($ut);
					$ct = $db->getCurrentTimestamp();
					$cd = Q_Config::get('Places', 'cache', 'duration', 60*60*24*30);
					if ($ct - $ut < $cd) {
						// there are cached autocomplete results that are still viable
						return json_decode($pa->results, true);
					}
				}
			}
		}

		$key = Q_Config::expect('Places', 'google', 'keys', 'server');
		$location = "$latitude,$longitude";
		$radius = ceil(1609.34 * $miles);
		if ($types === null) {
			unset($types);
		}
		$query = http_build_query(compact('key', 'input', 'types', 'location', 'radius'));
		$url = "https://maps.googleapis.com/maps/api/place/autocomplete/json?$query";
		$ch = curl_init();
		curl_setopt($ch, CURLOPT_URL, $url);
		curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
		$json = curl_exec($ch);
		curl_close($ch);
		$response = json_decode($json, true);
		if (empty($response['predictions'])) {
			throw new Q_Exception("Places::autocomplete: Couldn't obtain predictions for $input");
		}
		if (!empty($response['error_message'])) {
			throw new Q_Exception("Places::autocomplete: ".$response['error_message']);
		}
		$results = $response['predictions'];
		if ($pa) {
			$pa->results = json_encode($results);
			$pa->save();
		}
		return $results;
	}
	
	/**
	 * Use this to calculate the haversine distance between two sets of lat/long coordinates on the Earth
	 * @method distance
	 * @static
	 * @param {double} $lat_1
	 * @param {double} $long_1
	 * @param {double} $lat_2
	 * @param {double} $long_2
	 * @return {double} The result of applying the haversine formula
	 */
	static function distance($lat_1,$long_1,$lat_2,$long_2)
	{
		$earth_radius = 3963.1676; // in miles

		$sin_lat   = sin(deg2rad($lat_2  - $lat_1)  / 2.0);
		$sin2_lat  = $sin_lat * $sin_lat;

		$sin_long  = sin(deg2rad($long_2 - $long_1) / 2.0);
		$sin2_long = $sin_long * $sin_long;

		$cos_lat_1 = cos(deg2rad($lat_1));
		$cos_lat_2 = cos(deg2rad($lat_2));

		$sqrt	  = sqrt($sin2_lat + ($cos_lat_1 * $cos_lat_2 * $sin2_long));
		$distance  = 2.0 * $earth_radius * asin($sqrt);

		return $distance;
	}
	
	/**
	 * Call this function to find the "nearby points" to subscribe to
	 * on a grid of quantized (latitude, longitude) pairs
	 * which are spaced at most $miles apart.
	 * @param {double} $latitude The latitude of the coordinates to search around
	 * @param {double} $longitude The longitude of the coordinates to search around
	 * @param {double} $miles The radius, in miles, around this location.
	 *  Should be one of the array values in the Places/nearby/miles config.
	 * @return {Array} Returns an array of up to four ($streamName => $info) pairs
	 *  where the $streamName is the name of the stream corresponding to the "nearby point"
	 *  and $info includes the keys "latitude", "longitude", and "miles".
	 */
	static function nearbyForSubscribers(
		$latitude, 
		$longitude, 
		$miles)
	{
		list($latQuantized, $longQuantized, $latGrid, $a)
			= self::quantize($latitude, $longitude, $miles);

		$milesArray = Q_Config::expect('Places', 'nearby', 'miles');
		if (!in_array($miles, $milesArray)) {
			throw new Q_Exception("The miles value needs to be in Places/nearby/miles config.");
		}
		
		$result = array();
		foreach (array($latQuantized, $latQuantized+$latGrid*1.1) as $lat) {
			list($a, $b, $c, $longGrid) = self::quantize($lat, $longitude, $miles);
			foreach (array($longQuantized, $longQuantized+$longGrid*1.1) as $long) {
				list($latQ, $longQ) = self::quantize($lat, $long, $miles);
				if ($longQ > 180) { $longQ = $long%180 - 180; }
				if ($longQ < -180) { $longQ = $long%180 + 180; }
				if ($latQ > 90) { $latQ = $latQ%90 - 90; }
				if ($latQ < -90) { $latQ = $latQ%90 + 90; }
				$streamName = self::streamName($latQ, $longQ, $miles);
				$result[$streamName] = array(
					'latitude' => $lat,
					'longitude' => $long,
					'geohash' => Places_Geohash::encode($latQ, $longQ, 6),
					'miles' => $miles
				);
			}
		}
		return $result;
	}
	
	/**
	 * Call this function to find the "nearby points" to publish to
	 * on a grid of quantized (latitude, longitude) pairs
	 * which are spaced at most $miles apart.
	 * @method nearbyForPublishers
	 * @static
	 * @param {double} $latitude The latitude of the coordinates to search around
	 * @param {double} $longitude The longitude of the coordinates to search around
	 * @param {array} [$milesArray=null] To override the default in "Places"/"nearby"/"miles" config
	 * @return {array} Returns an array of several ($streamName => $info) pairs
	 *  where the $streamName is the name of the stream corresponding to the "nearby point"
	 *  and $info includes the keys "latitude", "longitude", and "miles".
	 */
	static function nearbyForPublishers(
		$latitude, 
		$longitude,
		$milesArray = null)
	{
		$result = array();
		if (!isset($milesArray)) {
			$milesArray = Q_Config::expect('Places', 'nearby', 'miles');
		}
		foreach ($milesArray as $miles) {
			if ($longitude > 180) { $longitude = $longitude%180 - 180; }
			if ($longitude < -180) { $longitude = $longitude%180 + 180; }
			if ($latitude > 90) { $latitude = $latitude%90 - 90; }
			if ($latitude < -90) { $latitude = $latitude%90 + 90; }
			list($latQuantized, $longQuantized, $latGrid, $longGrid)
				= self::quantize($latitude, $longitude, $miles);
			$streamName = self::streamName($latQuantized, $longQuantized, $miles);
			$result[$streamName] = array(
				'latitude' => $latQuantized,
				'longitude' => $longQuantized,
				'geohash' => Places_Geohash::encode($latQuantized, $longQuantized, 6),
				'miles' => $miles
			);
		}
		return $result;
	}
	
	/**
	 * Call this function to subscribe to streams on which messages are posted
	 * related to things happening the given number of $miles around the given location.
	 * @method subscribe
	 * @static
	 * @param {double} $latitude The latitude of the coordinates to subscribe around
	 * @param {double} $longitude The longitude of the coordinates to subscribe around
	 * @param {double} $miles The radius, in miles, around this location.
	 *  Should be one of the array values in the Places/nearby/miles config.
	 * @param {string} $publisherId The id of the publisher publishing these streams.
	 *  Defaults to the app name in Q/app config.
	 * @param {array} $options The options to pass to the subscribe function
	 * @return {Array} Returns an array of up to four arrays of ($publisherId, $streamName)
	 *  of streams that were subscribed to.
	 */
	static function subscribe(
		$latitude, 
		$longitude, 
		$miles,
		$publisherId = null,
		$options = array())
	{
		return self::subscribersDo($latitude, $longitude, $miles, $publisherId, $options, 'subscribe');
	}
	
	/**
	 * Call this function to unsubscribe from streams you previously subscribed to
	 * using Places::subscribe.
	 * @method unsubscribe
	 * @static
	 * @param {double} $latitude The latitude of the coordinates to subscribe around
	 * @param {double} $longitude The longitude of the coordinates to subscribe around
	 * @param {double} $miles The radius, in miles, around this location.
	 *  Should be one of the array values in the Places/nearby/miles config.
	 * @param {string} $publisherId The id of the publisher publishing these streams.
	 *  Defaults to the app name in Q/app config.
	 * @param {array} $options The options to pass to the unsubscribe function
	 * @return {Array} Returns an array of up to four arrays of ($publisherId, $streamName)
	 *  of streams that were subscribed to.
	 */
	static function unsubscribe(
		$latitude, 
		$longitude, 
		$miles,
		$publisherId = null,
		$options = array())
	{
		return self::subscribersDo($latitude, $longitude, $miles, $publisherId, $options, 'unsubscribe');
	}
	
	protected static function subscribersDo(
		$latitude, 
		$longitude, 
		$miles,
		$publisherId = null,
		$options = array(),
		$action = null)
	{
		$user = Users::loggedInUser(true);
		$nearby = Places::nearbyForSubscribers($latitude, $longitude, $miles);
		if (!$nearby) { return array(); }
		if (!isset($publisherId)) {
			$publisherId = Q_Config::expect('Q', 'app');
		}
		if ($transform = Q::ifset($options, 'transform', null)) {
			$create = Q::ifset($options, 'create', null);
			$transformed = call_user_func($transform, $nearby, $options);
		} else {
			$transformed = array_keys($nearby);
			$createMethod = ($action === 'subscribe')
				? array('Places', '_createNearby')
				: null;
			$create = Q::ifset($options, 'create', $createMethod);
		}
		$streams = Streams::fetch(null, $publisherId, $transformed);
		$participants = Streams_Participant::select('*')
			->where(array(
				'publisherId' => $publisherId,
				'streamName' => $transformed,
				'userId' => $user->id
			))->ignoreCache()->fetchDbRows(null, null, 'streamName');
		foreach ($nearby as $name => $info) {
			$name = isset($transformed[$name]) ? $transformed[$name] : $name;
			if (empty($streams[$name])) {
				if (empty($create)) {
					continue;
				}
				$params = compact(
					'publisherId', 'latitude', 'longitude',
					'transformed', 'miles',
					'nearby', 'name', 'info', 'streams'
				);
				$streams[$name] = call_user_func($create, $params, $options);
			}
			$stream = $streams[$name];
			$subscribed = ('yes' === Q::ifset($participants, $name, 'subscribed', 'no'));
			if ($action === 'subscribe' and !$subscribed) {
				$stream->subscribe($options);
			} else if ($action === 'unsubscribe' and $subscribed) {
				$stream->unsubscribe($options);
			}
		}
		return $streams;
	}
	
	/**
	 * Call this function to relate a stream to category streams for things happening
	 * around the given location.
	 * @method relateTo
	 * @static
	 * @param {string} $publisherId The publisherId of the category streams
	 * @param {double} $latitude The latitude of the coordinates near which to relate
	 * @param {double} $longitude The longitude of the coordinates near which to relate
	 * @param {string} $fromPublisherId The publisherId of the stream to relate
	 * @param {string} $fromStreamName The name of the stream to relate
	 * @param {string} $relationType The type of the relation to add
	 * @param {array} $options The options to pass to the Streams::relate and Streams::create functions. Also can contain the following options:
	 * @param {array} [$options.miles] Override the default set of distances found in the config under Places/nearby/miles
	 * @param {callable} [$options.create] If set, this callback will be used to create streams when they don't already exist. It receives the $options array and should return a Streams_Stream object. Otherwise the category stream is skipped.
	 * @param {callable} [$options.transform="array_keys"] Can be used to override the function which takes the output of Places::nearbyForPublishers, and this $options array, and returns the array of ($originalName => $newCategoryName) pairs.
	 * @return {array|boolean} Returns the array of category streams
	 */
	static function relateTo(
		$publisherId,
		$latitude, 
		$longitude, 
		$fromPublisherId,
		$fromStreamName,
		$relationType,
		$options = array())
	{
		$miles = Q::ifset($options, 'miles', null);
		$nearby = Places::nearbyForPublishers($latitude, $longitude, $miles);
		if (!isset($fromPublisherId)) {
			$fromPublisherId = Q_Config::expect('Q', 'app');
		}
		if ($transform = Q::ifset($options, 'transform', null)) {
			$create = Q::ifset($options, 'create', null);
			$transformed = call_user_func($transform, $nearby, $options);
		} else {
			$transformed = array_keys($nearby);
			$create = Q::ifset($options, 'create', array('Places', '_createNearby'));
		}
		$streams = Streams::fetch(null, $publisherId, $transformed);
		foreach ($nearby as $k => $info) {
			$name = isset($transformed[$k]) ? $transformed[$k] : $k;
			if (empty($streams[$name])) {
				if (empty($create)) {
					continue;
				}
				$params = compact(
					'publisherId', 'latitude', 'longitude',
					'fromPublisherId', 'fromStreamName',
					'relationType',
					'transformed', 'miles',
					'nearby', 'name', 'info', 'streams'
				);
				$streams[$name] = call_user_func($create, $params, $options);
			}
			$stream = $streams[$name];
			Streams::relate(
				null,
				$stream->publisherId,
				$stream->name,
				$relationType,
				$fromPublisherId,
				$fromStreamName,
				$options
			);
		}
		return $streams;
	}
	
	/**
	 * Call this function to quantize a (latitude, longitude) pair to grid of quantized
	 * (latitude, longitude) pairs which are spaced at most $miles apart.
	 * @param {double} $latitude The latitude of the coordinates to search around
	 * @param {double} $longitude The longitude of the coordinates to search around
	 * @param {double} $miles The radius, in miles, around this location.
	 *  Should be one of the array values in the Places/nearby/miles config.
	 * @return {Array} Returns an array of latitude and longitude quantized,
	 *  followed by the latitude and longitude grid spacing.
	 */
	static function quantize(
		$latitude, 
		$longitude, 
		$miles)
	{
		$latGrid = $miles / 69.1703234283616;
		$latQuantized = floor($latitude / $latGrid) * $latGrid;
		$longGrid = abs($latGrid / cos(deg2rad($latQuantized)));
		$longQuantized = floor($longitude / $longGrid) * $longGrid;
		return array($latQuantized, $longQuantized, $latGrid, $longGrid);
	}
	
	/**
	 * Obtain the name of a "Places/nearby" stream
	 * corresponding to the given parameters
	 * @method streamName
	 * @static
	 * @param {double} $latitude,
	 * @param {double} $longitude
	 * @param {double} $miles
	 */
	static function streamName($latitude, $longitude, $miles)
	{
		if ($before = Q::event('Places/streamName',
		compact('latitude', 'longitude', 'miles'), 'before')) {
			return $before;
		}
		$geohash = Places_Geohash::encode($latitude, $longitude, 6);
		return "Places/nearby/$geohash/$miles";
	}
	
	/**
	 * Fetch a stream on which messages are posted relating to things happening
	 * a given number of $miles around the given location.
	 * If it doesn't exist, create it.
	 * @method nearbyStream
	 * @static
	 * @param {double} $latitude The latitude of the coordinates to search around
	 * @param {double} $longitude The longitude of the coordinates to search around
	 * @param {double} $miles The radius, in miles, around this location.
	 *  Should be one of the array values in the Places/nearby/miles config.
	 * @param {string} $publisherId The id of the publisher to publish this stream
	 *  Defaults to the app name in Q/app config.
	 * @param {string} $streamName The name of the stream to create.
	 *  Defaults to Places::streamName($latitude, $longitude, $miles).
	 * @return {Streams_Stream} Returns the stream object that was created or fetched.
	 */
	static function nearbyStream(
		$latitude, 
		$longitude, 
		$miles,
		$publisherId = null,
		$streamName = null)
	{
		list($latitude, $longGrid)
			= self::quantize($latitude, $longitude, $miles);
		$zipcodes = Places_Zipcode::nearby(
			$latitude, $longitude, $miles, 1
		);
		if (!isset($publisherId)) {
			$publisherId = Q_Config::expect('Q', 'app');
		}
		if (!isset($streamName)) {
			$streamName = self::streamName($latitude, $longitude, $miles);
		}
		if ($stream = Streams::fetchOne(null, $publisherId, $streamName)) {
			return $stream;
		}
		$zipcode = $zipcodes ? reset($zipcodes) : null;
		$stream = new Streams_Stream();
		$stream->publisherId = $publisherId;
		$stream->name = $streamName;
		$stream->type = "Places/nearby";
		$stream->title = $zipcode
			? "Nearby ($latitude, $longitude): {$zipcode->placeName}, zipcode {$zipcode->zipcode}"
			: "Nearby ($latitude, $longitude)";
		$stream->setAttribute('latitude', $latitude);
		$stream->setAttribute('longitude', $longitude);
		if ($zipcode) {
			$stream->setAttribute('zipcode', $zipcode->zipcode);
			$stream->setAttribute('placeName', $zipcode->placeName);
			$stream->setAttribute('state', $zipcode->state);
		}
		$stream->save();
		return $stream;
	}
	
	/**
	 * Call this function to relate a stream to category streams for things happening
	 * around the given location, during a particular hour.
	 * @method relateToTimeslot
	 * @static
	 * @param {string} $publisherId The publisherId of the category streams
	 * @param {double} $latitude The latitude of the coordinates near which to relate
	 * @param {double} $longitude The longitude of the coordinates near which to relate
	 * @param {double} $timestamp Timestamp the stream "takes place", used to determine the hour
	 * @param {string} $fromPublisherId The publisherId of the stream to relate
	 * @param {string} $fromStreamName The name of the stream to relate
	 * @param {string} $relationType The type of the relation to add
	 * @param {array} $options The options to pass to the Streams::relate and Streams::create functions. Also can contain the following options:
	 * @param {array} [$options.miles] Override the default set of distances found in the config under Places/nearby/miles
	 * @return {array|boolean} Returns the array of category streams
	 */
	static function relateToTimeslot(
		$publisherId,
		$latitude, 
		$longitude, 
		$timestamp,
		$fromPublisherId,
		$fromStreamName,
		$options = array())
	{
		$options = array_merge(array(
			'transform' => array('Places', '_transformTimeslot'),
			'create' => array('Places', '_createTimeslot'),
			'timestamp' => $timestamp
		), $options);
		Places::relateTo(
			$publisherId,
			$latitude,
			$longitude,
			$fromPublisherId,
			$fromStreamName,
			Q::ifset($options, 'relationType', 'Places/timeslot'),
			$options
		);
	}
	
	/**
	 * Call this function to relate a stream to category streams for things happening
	 * around the given location, about a certain interest.
	 * @method relateToInterest
	 * @static
	 * @param {string} $publisherId The publisherId of the category streams
	 * @param {double} $latitude The latitude of the coordinates near which to relate
	 * @param {double} $longitude The longitude of the coordinates near which to relate
	 * @param {double} $title The title of the interest, which will be normalized
	 * @param {string} $fromPublisherId The publisherId of the stream to relate
	 * @param {string} $fromStreamName The name of the stream to relate
	 * @param {string} $relationType The type of the relation to add
	 * @param {array} $options The options to pass to the Streams::relate and Streams::create functions. Also can contain the following options:
	 * @param {array} [$options.miles] Override the default set of distances found in the config under Places/nearby/miles
	 * @return {array|boolean} Returns the array of category streams
	 */
	static function relateToInterest(
		$publisherId,
		$latitude, 
		$longitude, 
		$title,
		$fromPublisherId,
		$fromStreamName,
		$options = array())
	{
		$options = array_merge(array(
			'transform' => array('Places', '_transformInterest'),
			'create' => array('Places', '_createInterest'),
			'title' => $title
		), $options);
		Places::relateTo(
			$publisherId,
			$latitude,
			$longitude,
			$fromPublisherId,
			$fromStreamName,
			Q::ifset($options, 'relationType', 'Places/interest'),
			$options
		);
	}
	
	static function _transformTimeslot($nearby, $options)
	{
		$timestamp = $options['timestamp'];
		$timestamp = $timestamp - $timestamp % 3600;
		$result = array();
		foreach ($nearby as $k => $info) {
			$result[$k] = "Places/timeslot/$info[geohash]/$info[miles]/h/$timestamp";
		}
		return $result;
	}
	
	static function _createTimeslot($params, $options)
	{
		$timestamp = $options['timestamp'];
		$timestamp = $timestamp - $timestamp % 3600;
		$info = $params['info'];
		$options['name'] = "Places/timeslot/$info[geohash]/$info[miles]/h/$timestamp";
		return Streams::create(null, $params['publisherId'], 'Places/timeslot', $options);
	}
	
	static function _transformInterest($nearby, $options)
	{
		$title = Q_Utils::normalize($options['title']);
		$result = array();
		foreach ($nearby as $k => $info) {
			$result[$k] = "Places/interest/$info[geohash]/$info[miles]/$title";
		}
		return $result;
	}
	
	static function _createInterest($params, $options)
	{
		$title = Q_Utils::normalize($options['title']);
		$info = $params['info'];
		$options['name'] = "Places/interest/$info[geohash]/$info[miles]/$title";
		return Streams::create(null, $params['publisherId'], 'Places/interest', $options);
	}
	
	static function _createNearby($params, $options)
	{
		$info = $params['info'];
		return Places::nearbyStream(
			$info['latitude'], $info['longitude'], $info['miles'],
			Q::ifset($info, 'publisherId', null),
			Q::ifset($info, 'name', null)
		);
	}
};