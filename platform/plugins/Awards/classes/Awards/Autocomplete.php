<?php
/**
 * @module Awards
 */
/**
 * Class representing 'Autocomplete' rows in the 'Awards' database
 * You can create an object of this class either to
 * access its non-static methods, or to actually
 * represent a autocomplete row in the Awards database.
 *
 * @class Awards_Autocomplete
 * @extends Base_Awards_Autocomplete
 */
class Awards_Autocomplete extends Base_Awards_Autocomplete
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
	 * Add any Awards_Autocomplete methods here, whether public or not
	 * If file 'Autocomplete.php.inc' exists, its content is included
	 * * * */

	/* * * */
	/**
	 * Implements the __set_state method, so it can work with
	 * with var_export and be re-imported successfully.
	 * @method __set_state
	 * @param {array} $array
	 * @return {Awards_Autocomplete} Class instance
	 */
	static function __set_state(array $array) {
		$result = new Awards_Autocomplete();
		foreach($array as $k => $v)
			$result->$k = $v;
		return $result;
	}
};