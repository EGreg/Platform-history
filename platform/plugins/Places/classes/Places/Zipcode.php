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
	public function nearby($miles, $saveNearby = true)
	{
		$zipcodes = Places::nearby(
			$this->latitude, $this->longitude, $miles, $this->zipcode, $saveNearby
		);
		return $zipcodes;
	}
	
	protected static function compareMiles($a, $b)
	{
		return $a['miles'] - $b['miles'];
	}
	
	/**
	 * Use this to calculate the distance of a zipcode's central point to some
	 * pair of geographic coordinates.
	 * @param {double} $latitude
	 * @param {double} $longitude
	 */
	function distanceTo($latitude, $longitude)
	{
		return Places::distance($this->latitude, $this->longitude, $latitude, $longitude);
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