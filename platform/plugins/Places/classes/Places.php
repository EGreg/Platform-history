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
	
	static function userLocationStream()
	{
		$user = Users::loggedInUser(true);
		$streamName = "Places/user/location";
		$stream = Streams::fetchOne($user->id, $user->id, $streamName);
		if (!$stream) {
			$stream = new Streams_Stream();
			$stream->publisherId = $user->id;
			$stream->name = $streamName;
			$stream->type = "Places/location";
			$stream->save();
			$stream->join();
		}
		return $stream;
	}
	
	/**
	 * Use this to calculate the haversine distance between two sets of lat/long coordinates on the Earth
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

		$sqrt      = sqrt($sin2_lat + ($cos_lat_1 * $cos_lat_2 * $sin2_long));
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
		list($latQuantized, $longQuantized, $latGrid, $longGrid)
			= self::quantize($latitude, $longitude, $miles);

		$milesArray = Q_Config::expect('Places', 'nearby', 'miles');
		if (!in_array($miles, $milesArray)) {
			throw new Q_Exception("The miles value needs to be in Places/nearby/miles config.");
		}
		
		$result = array();
		foreach (array($latQuantized, $latQuantized+$latGrid) as $lat) {
			foreach (array($longQuantized, $longQuantized+$longGrid) as $long) {
				if ($long > 180) { $long = $long%180 - 180; }
				if ($long < -180) { $long = $long%180 + 180; }
				if ($lat > 90) { $lat = $lat%90 - 90; }
				if ($lat < -90) { $lat = $lat%90 + 90; }
				$streamName = self::streamName($lat, $long, $miles);
				$result[$streamName] = array(
					'latitude' => $lat,
					'longitude' => $long,
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
	 * @param {double} $latitude The latitude of the coordinates to search around
	 * @param {double} $longitude The longitude of the coordinates to search around
	 * @return {Array} Returns an array of several ($streamName => $info) pairs
	 *  where the $streamName is the name of the stream corresponding to the "nearby point"
	 *  and $info includes the keys "latitude", "longitude", and "miles".
	 */
	static function nearbyForPublishers(
		$latitude, 
		$longitude)
	{
		list($latQuantized, $longQuantized, $latGrid, $longGrid)
			= self::quantize($latitude, $longitude, $miles);
		
		$result = array();
		$milesArray = Q_Config::expect('Places', 'nearby', 'miles');
		foreach ($milesArray as $miles) {
			if ($longitude > 180) { $longitude = $longitude%180 - 180; }
			if ($longitude < -180) { $longitude = $longitude%180 + 180; }
			if ($latitude > 90) { $latitude = $latitude%90 - 90; }
			if ($latitude < -90) { $latitude = $latitude%90 + 90; }
			$streamName = self::streamName($latitude, $longitude, $miles);
			$result[$streamName] = array(
				'latitude' => $latitude,
				'longitude' => $longitude,
				'miles' => $miles
			);
		}
		return $result;
	}
	
	/**
	 * Call this function to subscribe to streams on which messages are posted
	 * related to things happening the given number of $miles around the given location.
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
		$nearby = Places::nearbyForSubscribers($latitude, $longitude, $miles);
		if (!$nearby) { return array(); }
		if (!isset($publisherId)) {
			$publisherId = Q_Config::expect('Q', 'app');
		}
		$streams = Streams::fetch(null, $publisherId, array_keys($nearby));
		$participants = Streams_Participant::select('*')
			->where(array(
				'publisherId' => $publisherId,
				'streamName' => array_keys($nearby),
				'userId' => Users::loggedInUser()->id
			))->ignoreCache()->fetchDbRows(null, null, 'streamName');
		foreach ($nearby as $name => $nb) {
			$stream = $streams[$name];
			if (!$stream) {
				$streams[$name] = $stream = Places::nearbyStream(
					$nb['latitude'], $nb['longitude'], $miles, $publisherId, $name
				);
			}
			$subscribed = ('yes' === Q::ifset($participants, $name, 'subscribed', 'no'));
			if ($action === 'subscribe' and !$subscribed) {
				Q::log('subscribe');
				$stream->subscribe($options);
			} else if ($action === 'unsubscribe' and $subscribed) {
				Q::log('unsubscribe');
				$stream->unsubscribe();
			}
		}
		return $streams;
	}
	
	/**
	 * Call this function to relate a stream to streams for things happening
	 * the given number of $miles around the given location.
	 * @param {double} $latitude The latitude of the coordinates near which to relate
	 * @param {double} $longitude The longitude of the coordinates near which to relate
	 * @param {string} $fromPublisherId The publisherId of the stream to relate
	 * @param {string} $fromStreamName The name of the stream to relate
	 * @param {string} $relationType The type of the relation to add
	 * @param {array} $options The options to pass to the Streams::relate function
	 *  Also can contain "miles" to override the default set of distances.
	 * @return {array|boolean} Returns whatever the Streams::relate function returns
	 */
	static function relateTo(
		$latitude, 
		$longitude, 
		$fromPublisherId,
		$fromStreamName,
		$relationType,
		$options = array())
	{
		$nearby = Places::nearbyForPublishers($latitude, $longitude);
		if (!isset($fromPublisherId)) {
			$fromPublisherId = Q_Config::expect('Q', 'app');
		}
		$streams = Streams::fetch(null, $fromPublisherId, array_keys($nearby));
		foreach ($nearby as $name => $nb) {
			$stream = $streams[$name];
			if (!$stream) {
				$streams[$name] = $stream = Places::nearbyStream(
					$nb['latitude'], $nb['longitude'], $miles, $fromPublisherId, $name
				);
			}
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
		$stream = Streams::fetchOne(null, $publisherId, $streamName);
		if ($stream) {
			return $stream;
		}
		$zipcode = reset($zipcodes);
		$stream = new Streams_Stream();
		$stream->publisherId = $publisherId;
		$stream->name = $streamName;
		$stream->type = "Places/nearby";
		$stream->title = $zipcode
			? "Nearby ($latitude, $longitude): {$zipcode->placeName}, zipcode {$zipcode->zipcode}"
			: "Nearby ($latitude, $longitude)";
		$stream->save();
		return $stream;
	}
};