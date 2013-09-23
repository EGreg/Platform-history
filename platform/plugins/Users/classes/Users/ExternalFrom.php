<?php
/**
 * @module Users
 */
/**
 * Class representing 'ExternalFrom' rows in the 'Users' database
 * You can create an object of this class either to
 * access its non-static methods, or to actually
 * represent a external_from row in the Users database.
 *
 * @class Users_ExternalFrom
 * @extends Base_Users_ExternalFrom
 */
class Users_ExternalFrom extends Base_Users_ExternalFrom
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
	 * Assign 'xid' field if not set
	 * @method beforeSave
	 * @param {array} $modified_fields
	 * @return {array}
	 */
	function beforeSave($updated_fields)
	{
		if (!$this->retrieved) {
			if (!isset($updated_fields['xid'])) {
				$this->xid = $updated_fields['xid'] = 
				self::db()->uniqueId(self::table(), 'xid', null, array(
					'characters' => '0123456789abcdefghijklmnopqrstuvwxyz',
					'length' => 7
				));
			}
		}
		return parent::beforeSave($updated_fields);
	}

	/* * * */
	/**
	 * Implements the __set_state method, so it can work with
	 * with var_export and be re-imported successfully.
	 * @method __set_state
	 * @param {array} $array
	 * @return {Users_ExternalFrom} Class instance
	 */
	static function __set_state(array $array) {
		$result = new Users_ExternalFrom();
		foreach($array as $k => $v)
			$result->$k = $v;
		return $result;
	}
};