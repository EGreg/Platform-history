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
	}

	/**
	 * Add user to label
	 * @method {boolean} addLabel
	 * @param {string} $label
	 * @param {string} [$userId=null] user current user if not provided
	 * @param {string} [$title=''] specify the title, otherwise a default one is generated
	 * @param {string} [$icon='default']
	 */
	static function addLabel(
		$label, 
		$userId = null, 
		$title = '', 
		$icon = 'default')
	{
		if (!isset($userId)) {
			$user = Users::loggedInUser(true);
			$userId = $user->id;
		}
		if (empty($title)) {
			$parts = explode("/");
			$title = ucfirst(end($parts));
		}
		$l = new Users_Label();
		$l->label = $label;
		$l->userId = $userId;
		$l->title = $title;
		$l->icon = $icon;
		return $l->save(true); 
	}

	/**
	 * Remove label
	 * @method removeLabel
	 * @param {string} $label
	 * @param {string|null} [$userId=null]
	 * @return {boolean}
	 */
	static function removeLabel($label, $userId = null)
	{
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
	
	/**
	 * Fetch an array of labels. By default, returns all the labels.
	 * @method fetch
	 * @param {string} [$userId=null] The id of the user whose contact labels should be fetched
	 * @param {string|Db_Expression} [$filter=''] Pass a string prefix such as "Users/", or some db expression, to get only a particular subset of labels.
	 * @param {boolean} [$checkContacts=false] Whether to also look in the Users_Contact table and only return labels that have at least one contact.
	 * @return {array} An array of array(label => title) pairs
	 */
	static function fetch($userId = null, $filter = '', $checkContacts = false)
	{
		if (!isset($userId)) {
			$user = Users::loggedInUser(true);
			$userId = $user->id;
		}
		$criteria = array('userId' => $userId);
		if ($filter) {
			$criteria['label'] = is_string($filter)
				? new Db_Range($filter, true, false, null)
				: $filter;
		}
		if ($checkContacts) {
			$contact_array = Users_Contact::select('*')
				->where($criteria)
				->groupBy('userId, label')
				->fetchDbRows();
		}
		$labels = Users_Label::select('*')
			->where($criteria)
			->fetchDbRows(null, null, 'label');
		$icons = array();
		if (!$checkContacts) {
			return $labels;
		}
		$contacts = array();
		foreach ($contact_array as $contact) {
			$contacts[$contact->label] = $contact->label;
		}
		foreach ($labels as $label) {
			if (!isset($contacts[$label->label])) {
				unset($labels[$label->label]);
			}
		}
		return $labels;
	}

	/* * * */
	/**
	 * Implements the __set_state method, so it can work with
	 * with var_export and be re-imported successfully.
	 * @method __set_state
	 * @param {array} $array
	 * @return {Users_Label} Class instance
	 */
	static function __set_state(array $array)
	{
		$result = new Users_Label();
		foreach($array as $k => $v)
			$result->$k = $v;
		return $result;
	}
};