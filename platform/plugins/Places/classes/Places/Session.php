<?php
/**
 * @module Places
 */
/**
 * Class representing 'Session' rows in the 'Places' database
 * You can create an object of this class either to
 * access its non-static methods, or to actually
 * represent a session row in the Places database.
 *
 * @class Places_Session
 * @extends Base_Places_Session
 */
class Places_Session extends Base_Places_Session
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
	 * Add any Places_Session methods here, whether public or not
	 * If file 'Session.php.inc' exists, its content is included
	 * * * */

	/* * * */
	/**
	 * Implements the __set_state method, so it can work with
	 * with var_export and be re-imported successfully.
	 * @method __set_state
	 * @param {array} $array
	 * @return {Places_Session} Class instance
	 */
	static function __set_state(array $array) {
		$result = new Places_Session();
		foreach($array as $k => $v)
			$result->$k = $v;
		return $result;
	}
};