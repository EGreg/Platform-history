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
	static function __set_state(array $array) {
		$result = new Places_Zipcode();
		foreach($array as $k => $v)
			$result->$k = $v;
		return $result;
	}
	
	
	/**
	 * Call this function to calculate and save Places_Nearby rows
	 * @param {double} $miles The radius, in miles, around the central point of the zipcode
	 * @param {double} $save_cache Defaults to true. Set to false to simply fetch them without saving Places_Nearby rows.
	 * @param {array} Array of all the Places_Zipcode rows that are within the given radius
	 */
	public function fetchNearbyZipcodes($miles, $save_nearby = true) {

		// First, get a bounding box
		$max_lat = $miles/69/sqrt(2);
		$max_lon = $miles/69/sqrt(2);
		
		// Now, select zipcodes in a bounding box using one of the indexes
		$q = Places_Zipcode::select('*')->where(array(
			'latitude >' => $this->latitude - $max_lat,
			'latitude <' => $this->latitude + $max_lat,
			'zipcode !=' => $this->zipcode
		));
		$longitudes = array(
			'longitude >' => max($this->longitude - $max_lon, -180),
			'longitude <' => min($this->longitude + $max_lon, 180),
		);
		if ($this->latitude + $max_lon > 180) {
			$q->andWhere($longitudes, array(
				'longitude >' => -180, // should always be the case anyway
				'longitude <' => $this->longitude + $max_lon - 180 * 2,
			));
		} else if ($this->latitude - $max_lon < -180) {
			$q->andwhere($longitudes, array(
				'longitude <=' => 180, // should always be the case anyway
				'longitude >' => $this->longitude - $max_lon + 180 * 2,
			));
		} else {
			$q->andWhere($longitudes);
		}
		$zipcodes = $q->noCache()->fetchDbRows();
		if ($save_nearby) {
			foreach ($zipcodes as $z) {
				$pn = new Places_Nearby();
				$pn->fromZipcode = $z->zipcode;
				$pn->toZipcode = $z->zipcode;
				$pn->miles = $this->distanceToZipcode($z);
				$pn->save();
			}
		}
		return $zipcodes;
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