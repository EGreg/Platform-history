<?php
/**
 * @module Users
 */
/**
 * Class representing 'Label' rows in the 'Users' database
 * You can create an object of this class either to
 * access its non-static methods, or to actually
 * represent a label row in the Users database.
 *
 * @class Users_Label
 * @extends Base_Users_Label
 */
class Users_Label extends Base_Users_Label
{
	/**
	 * The setUp() method is called the first time
	 * an object of this class is constructed.
	 * @method setUp
	 */
	function setUp()
	{
		parent::setUp();
	}	/**
	 * @method getTitle
	 * @param  {User_Label} $label
	 * @return {string}
	 */
	static function getTitle($label) {
		return $label->title;
	}

	/**
	 * Add user to label
	 * @method {boolean} addLabel
	 * @param {string} $label
	 * @param {string} [$userId=null] user current user if not provided
	 * @param {string} [$title='']
	 * @param {string} [$icon='default']
	 */
	static function addLabel($label, $userId = null, $title = '', $icon = 'default') {
		if (!isset($userId)) {
			$user = Users::loggedInUser(true);
			$userId = $user->id;
		}
		$l = new Users_Label();
		$l->label = $label;
		$l->userId = $userId;
		$l->title = $title;
		$l->icon = $icon;
		return $l->save(true); 
	}

	/**
	 * Retrieve label
	 * @method removeLabel
	 * @param {string} $label
	 * @param {string|null} [$userId=null]
	 * @return {boolean}
	 */
	static function getLabel($label, $userId = null) {
		if (!isset($userId)) {
			$user = Users::loggedInUser(true);
			$userId = $user->id;
		}
		$l = new Users_Label();
		$l->label = $label;
		$l->userId = $userId;
		return $l->retrieve();		
	}

	/**
	 * Remove label
	 * @method removeLabel
	 * @param {string} $label
	 * @param {string|null} [$userId=null]
	 * @return {boolean}
	 */
	static function removeLabel($label, $userId = null) {
		if (!isset($userId)) {
			$user = Users::loggedInUser(true);
			$userId = $user->id;
		}
		Users_Contact::delete()->where(array(
			'label' => $label,
			'userId' => $userId
		))->execute();
		$l = new Users_Label();
		$l->label = $label;
		$l->userId = $userId;
		return $l->remove(); 
	}

	/* * * */
	/**
	 * Implements the __set_state method, so it can work with
	 * with var_export and be re-imported successfully.
	 * @method __set_state
	 * @param {array} $array
	 * @return {Users_Label} Class instance
	 */
	static function __set_state(array $array) {
		$result = new Users_Label();
		foreach($array as $k => $v)
			$result->$k = $v;
		return $result;
	}
};