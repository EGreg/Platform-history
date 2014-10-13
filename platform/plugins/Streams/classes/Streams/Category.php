<?php
/**
 * @module Streams
 */
/**
 * Class representing 'Category' rows in the 'Streams' database
 * You can create an object of this class either to
 * access its non-static methods, or to actually
 * represent a category row in the Streams database.
 *
 * @class Streams_Category
 * @extends Base_Streams_Category
 */
class Streams_Category extends Base_Streams_Category
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
	 * Add any Streams_Category methods here, whether public or not
	 * If file 'Category.php.inc' exists, its content is included
	 * * * */

	/* * * */
	/**
	 * Implements the __set_state method, so it can work with
	 * with var_export and be re-imported successfully.
	 * @method __set_state
	 * @param {array} $array
	 * @return {Streams_Category} Class instance
	 */
	static function __set_state(array $array) {
		$result = new Streams_Category();
		foreach($array as $k => $v)
			$result->$k = $v;
		return $result;
	}
};