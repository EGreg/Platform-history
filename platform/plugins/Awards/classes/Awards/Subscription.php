<?php
/**
 * @module Awards
 */
/**
 * Class representing 'Subscription' rows in the 'Awards' database
 * You can create an object of this class either to
 * access its non-static methods, or to actually
 * represent a subscription row in the Awards database.
 *
 * @class Awards_Subscription
 * @extends Base_Awards_Subscription
 */
class Awards_Subscription extends Base_Awards_Subscription
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
	 * Add any Awards_Subscription methods here, whether public or not
	 * If file 'Subscription.php.inc' exists, its content is included
	 * * * */

	/* * * */
	/**
	 * Implements the __set_state method, so it can work with
	 * with var_export and be re-imported successfully.
	 * @method __set_state
	 * @static
	 * @param {array} $array
	 * @return {Awards_Subscription} Class instance
	 */
	static function __set_state(array $array) {
		$result = new Awards_Subscription();
		foreach($array as $k => $v)
			$result->$k = $v;
		return $result;
	}
};