<?php
/**
 * @module Places
 */
/**
 * Class representing 'HostnameSession' rows in the 'Places' database
 * You can create an object of this class either to
 * access its non-static methods, or to actually
 * represent a hostname_session row in the Places database.
 *
 * @class Places_HostnameSession
 * @extends Base_Places_HostnameSession
 */
class Places_HostnameSession extends Base_Places_HostnameSession
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
	 * Add any Places_HostnameSession methods here, whether public or not
	 * If file 'HostnameSession.php.inc' exists, its content is included
	 * * * */

	/* * * */
	/**
	 * Implements the __set_state method, so it can work with
	 * with var_export and be re-imported successfully.
	 * @method __set_state
	 * @param {array} $array
	 * @return {Places_HostnameSession} Class instance
	 */
	static function __set_state(array $array) {
		$result = new Places_HostnameSession();
		foreach($array as $k => $v)
			$result->$k = $v;
		return $result;
	}
};