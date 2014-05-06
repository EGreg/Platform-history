<?php
/**
 * @module Users
 */
/**
 * Class representing 'Contact' rows in the 'Users' database
 * You can create an object of this class either to
 * access its non-static methods, or to actually
 * represent a contact row in the Users database.
 *
 * @class Users_Contact
 * @extends Base_Users_Contact
 */
class Users_Contact extends Base_Users_Contact
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
	 * Add contact to label
	 * @method addContact
	 * @param {string} $userId
	 * @param {string} $label
	 * @param {string} $contactId
	 * @param {string} [$nickname='']
	 * @return {boolean}
	 */
	static function addContact($userId, $label, $contactId, $nickname = '') {
		$contact = new Users_Contact();
		$contact->userId = $userId;
		$contact->label = $label;
		$contact->contactUserId = $contactId;
		$contact->nickname = !empty($nickname) ? $nickname : '';
		return !!$contact->save(true);
	}

	/**
	 * Check if contact belongs to label
	 * @method checkContact
	 * @param {string} $userId
	 * @param {string} $label
	 * @param {string} $contactId
	 * @return {boolean}
	 */
	static function checkContact($userId, $label, $contactId) {
		if (!$userId or !$contactId) {
			return null;
		}
		if ($userId instanceof Users_User) {
			$userId = $userId->id;
		}
		if ($contactId instanceof Users_User) {
			$contactId = $contactId->id;
		}
		$contact = new Users_Contact();
		$contact->userId = $userId;
		$contact->label = $label;
		$contact->contactUserId = $contactId;
		return !!$contact->retrieve();
	}

	/**
	 * Retrieve contacts belonging to label
	 * @method getContacts
	 * @param {string} $userId
	 * @param {string|DB_Range} $label
	 * @param {array} [$options=array()] Query options including:
	 * 		@param 'limit' {integer}
	 * 		@param 'offset' {integer}
	 * @return {array}
	 */
	static function getContacts($userId, $label /* string|DB_Range */, $options = array()) {
		if (empty($label)) throw new Q_Exception("Label is required");
		$limit = isset($options['limit']) ? $options['limit'] : false;
		$offset = isset($options['offset']) ? $options['offset'] : 0;

		if (substr($label, -1) === '/') $label = new Db_Range($label, true, false, true);

		$query = Users_Contact::select('*')->where(array(
			'userId' => $userId,
			'label' => $label
		));
		if ($limit) $query = $query->limit($limit, $offset);
		return $query->fetchAll(PDO::FETCH_COLUMN, 2);
	}

	/**
	 * Remove contact from label
	 * @method removeContact
	 * @param {string} $userId
	 * @param {string} $label
	 * @param {string} $contactId
	 * @return {boolean}
	 */
	static function removeContact($userId, $label, $contactId) {
		$contact = new Users_Contact();
		$contact->userId = $userId;
		$contact->label = $label;
		$contact->contactUserId = $contactId;
		return !!$contact->remove();
	}

	/* * * */
	/**
	 * Implements the __set_state method, so it can work with
	 * with var_export and be re-imported successfully.
	 * @method __set_state
	 * @param {array} $array
	 * @return {Users_Contact} Class instance
	 */
	static function __set_state(array $array) {
		$result = new Users_Contact();
		foreach($array as $k => $v)
			$result->$k = $v;
		return $result;
	}
};