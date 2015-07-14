<?php
/**
 * @module Places
 */
/**
 * Class representing 'Domain' rows in the 'Places' database
 * You can create an object of this class either to
 * access its non-static methods, or to actually
 * represent a domain row in the Places database.
 *
 * @class Places_Domain
 * @extends Base_Places_Domain
 */
class Places_Domain extends Base_Places_Domain
{
	/**
	 * The setUp() method is called the first time
	 * an object of this class is constructed.
	 * @method setUp
	 */
	function setUp()
	{
		parent::setUp();
		// INSERT YOUR CODE HERE
		// e.g. $this->hasMany(...) and stuff like that.
	}

	/* 
	 * Add any Places_Domain methods here, whether public or not
	 * If file 'Domain.php.inc' exists, its content is included
	 * * * */

	/* * * */
	/**
	 * Implements the __set_state method, so it can work with
	 * with var_export and be re-imported successfully.
	 * @method __set_state
	 * @param {array} $array
	 * @return {Places_Domain} Class instance
	 */
	static function __set_state(array $array) {
		$result = new Places_Domain();
		foreach($array as $k => $v)
			$result->$k = $v;
		return $result;
	}
};