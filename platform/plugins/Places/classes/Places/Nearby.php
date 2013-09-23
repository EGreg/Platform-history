<?php
/**
 * @module Places
 */
/**
 * Class representing 'Nearby' rows in the 'Places' database
 * You can create an object of this class either to
 * access its non-static methods, or to actually
 * represent a nearby row in the Places database.
 *
 * @class Places_Nearby
 * @extends Base_Places_Nearby
 */
class Places_Nearby extends Base_Places_Nearby
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
	 * @return {Places_Nearby} Class instance
	 */
	static function __set_state(array $array) {
		$result = new Places_Nearby();
		foreach($array as $k => $v)
			$result->$k = $v;
		return $result;
	}
};