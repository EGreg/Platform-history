<?php
/**
 * @module Places
 */
/**
 * Class representing 'Zipcode' rows in the 'Places' database
 * You can create an object of this class either to
 * access its non-static methods, or to actually
 * represent a zipcode row in the Places database.
 *
 * @class Places_Zipcode
 * @extends Base_Places_Zipcode
 */
class Places_Zipcode extends Base_Places_Zipcode
{
	/**
	 * The setUp() method is called the first time
	 * an object of this class is constructed.
	 * @method setUp
	 */
	function setUp()
	{
		parent::setUp();
	}

	/**
	 * Implements the __set_state method, so it can work with
	 * with var_export and be re-imported successfully.
	 * @method __set_state
	 * @param {array} $array
	 * @return {Places_Zipcode} Class instance
	 */
	static function __set_state(array $array)
	{
		$result = new Places_Zipcode();
		foreach($array as $k => $v)
			$result->$k = $v;
		return $result;
	}
	
	
	/**
	 * Call this function to calculate and save Places_Nearby rows
	 * @param {double} $miles The radius, in miles, around the central point of the zipcode
	 * @param {boolean} $saveNearby Defaults to true. Set to false to simply fetch them without saving Places_Nearby rows.
	 * @return Array of all the Places_Zipcode rows that are within the given radius
	 */
	public function nearbyZipcodes($miles, $saveNearby = true)
	{
		$zipcodes = self::fetchNearbyZipcodes(
			$this->latitude, $this->longitude, $miles, $this->zipcode, $saveNearby
		);
		return $zipcodes;
	}
	
	/**
	 * Call this function to calculate and save Places_Nearby rows
	 * @param {double} $latitude The latitude of the coordinates to search around
	 * @param {double} $longitude The longitude of the coordinates to search around
	 * @param {double} $miles The radius, in miles, around the central point of the zipcode
	 * @param {string} $omitZipcode optional zipcode to omit
	 * @param {boolean} $saveNearby Defaults to true. Set to false to simply fetch them without saving Places_Nearby rows.
	 * @return Array of all the Places_Zipcode rows that are within the given radius
	 */
	static function fetchNearbyZipcodes(
		$latitude, 
		$longitude, 
		$miles, 
		$omitZipcode = null, 
		$saveNearby = true)
	{
		$existing = self::existingNearbyZipcodes($latitude, $longitude, $miles);
		if ($existing) {
			return $existing;
		}
		
		// First, get a bounding box
		$max_lat = $miles/69/sqrt(2);
		$max_lon = $miles/69/sqrt(2);
		
		// Now, select zipcodes in a bounding box using one of the indexes
		$criteria = array(
			'latitude >' => $latitude - $max_lat,
			'latitude <' => $latitude + $max_lat
		);
		if ($omitZipcode) {
			$criteria['zipcode !='] = $omitZipcode;
		}
		$q = Places_Zipcode::select('*')->where($criteria);
		$longitudes = array(
			'longitude >' => max($longitude - $max_lon, -180),
			'longitude <' => min($longitude + $max_lon, 180),
		);
		if ($latitude + $max_lon > 180) {
			$q->andWhere($longitudes, array(
				'longitude >' => -180, // should always be the case anyway
				'longitude <' => $longitude + $max_lon - 180 * 2,
			));
		} else if ($latitude - $max_lon < -180) {
			$q->andwhere($longitudes, array(
				'longitude <=' => 180, // should always be the case anyway
				'longitude >' => $longitude - $max_lon + 180 * 2,
			));
		} else {
			$q->andWhere($longitudes);
		}
		$zipcodes = $q->noCache()->fetchDbRows();
		if (!$saveNearby) {
			return $zipcodes;
		}
		foreach ($zipcodes as $z) {
			$pn = new Places_Nearby();
			$pn->latitude = $latitude;
			$pn->longitude = $longitude;
			$pn->toZipcode = $z->zipcode;
			$pn->miles = Places::distance($latitude, $longitude, $z->latitude, $z->longitude);
			$pn->save();
		}
		return self::existingNearbyZipcodes($latitude, $longitude, $miles);
	}
	
	protected static function existingNearbyZipcodes($latitude, $longitude, $miles)
	{
		$maxMiles = Q_Config::get('Places', 'nearbyZipcodes', 'maxMiles', 100);
		$limit = Q_Config::get('Places', 'nearbyZipcodes', 'limit', 100);
		$existing = Places_Nearby::select('toZipcode')->where(array(
			'latitude' => $latitude,
			'longitude' => $longitude,
			'miles <=' => min($miles, $maxMiles)
		))->limit($limit)->fetchAll(PDO::FETCH_COLUMN, 0);
		if (!$existing) {
			return null;
		}
		return Places_Zipcode::select('*')->where(array(
			'zipcode' => $existing
		))->fetchDbRows();
	}
	
	/**
	 * Use this to calculate the distance of a zipcode's central point to some lat/long pair
	 * @param {double} $lat
	 * @param {double} $long
	 */
	function distanceTo($lat, $long)
	{
		return Places::distance($this->latitude, $this->longitude, $lat, $long);
	}
	
	/**
	 * Use this to calculate the distance of a zipcode's central point to some lat/long pair
	 * @param {double} $lat
	 * @param {double} $long
	 */
	function distanceToZipcode($zipcode)
	{
		return Places::distance($this->latitude, $this->longitude, $zipcode->latitude, $zipcode->longitude);
	}
};