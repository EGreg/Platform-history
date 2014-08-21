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
	 * Call this function to find the "nearby points" on a grid of quantized
	 * (latitude, longitude) pairs which are spaced at most $miles apart.
	 * @param {double} $latitude The latitude of the coordinates to search around
	 * @param {double} $longitude The longitude of the coordinates to search around
	 * @param {double} $miles The radius, in miles, around this location. Try to limit this value to a discrete set of under 20 values.
	 * @return {Array} Returns an array of up to four ($streamName => $info) pairs
	 *  where the $streamName is the name of the stream corresponding to the "nearby point"
	 *  and $info includes the keys "latitude", "longitude", and "miles".
	 */
	static function nearby(
		$latitude, 
		$longitude, 
		$miles)
	{
		$latGrid = $miles / 69.1703234283616;
		$latQuantized = floor($latitude / $latGrid) * $latGrid;
		$longGrid = abs($latGrid / cos(deg2rad($latQuantized)));
		$longQuantized = floor($longitude / $longGrid) * $longGrid;
		
		$result = array();
		foreach (array($latQuantized, $latQuantized+$latGrid) as $lat) {
			foreach (array($longQuantized, $longQuantized+$longGrid) as $long) {
				$name = self::streamName($lat, $long, $miles);
				$result[$name] = array(
					'latitude' => $lat,
					'longitude' => $long,
					'miles' => $miles
				);
			}
		}
		return $result;
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
		$hash = md5("$latitude\t$longitude\t$miles");
		return "Places/nearby/$hash";
	}
};