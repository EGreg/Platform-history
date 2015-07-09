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
	 *  The id of the user whose contact will be added
	 * @param {string} $contactUserId
	 *  The id of the user who is the contact
	 * @param {string|array} $label
	 *  The label of the contact. This can be a string or an array of strings, in which case
	 *  multiple contact rows are saved.
	 * @param {string} [$nickname='']
	 *  Optional nickname to assign to the contact
	 *  @optional
	 * @throws {Q_Exception_RequiredField}
	 *	if $label is missing
	 * @return {array} Array of contacts that are saved
	 */
	static function addContact($userId, $label, $contactUserId, $nickname = '')
	{
		if (empty($label)) {
			throw new Q_Exception_RequiredField(
				array('field' => 'label')
			);
		}
		$labels = is_array($label) ? $label : array($label);
		$contacts = array();
		foreach ($labels as $l) {
			// Insert the contacts one by one, so if an error occurs
			// we can continue right on inserting the rest.
			$contact = new Users_Contact();
			$contact->userId = $userId;
			$contact->contactUserId = $contactUserId;
			$contact->label = $l;
			$contact->save(true);
			$contacts[] = $contact;
		}
		/**
		 * @event Users/User/addContact {after}
		 * @param {string} 'contactUserId'
		 * @param {string} 'label'
		 * @param {array} 'contacts'
		 */
		Q::event('Users/Contact/add', compact('contactUserId', 'label', 'contacts'), 'after');
		return $contacts;
	}

	/**
	 * Check if contact belongs to label
	 * @method checkLabel
	 * @param {string} $userId
	 * @param {string} $label
	 * @param {string} $contactId
	 * @return {boolean}
	 */
	static function checkLabel($userId, $label, $contactId)
	{
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
	 * @method fetch
	 * @param {string} $userId
	 * @param {string|Db_Range|Db_Expression} $label
	 * @param {array} [$options=array()] Query options including:
	 * @param {integer} [$options.limit=false]
	 * @param {integer} [$options.offset]
	 * @return {array}
	 */
	static function fetch($userId, $label = null /* string|Db_Range */, $options = array())
	{
		$limit = isset($options['limit']) ? $options['limit'] : false;
		$offset = isset($options['offset']) ? $options['offset'] : 0;
		
		$criteria = compact('userId');
		
		if ($label) {
			if (substr($label, -1) === '/') {
				$label = new Db_Range($label, true, false, true);
			}
			$criteria['label'] = $label;
		}

		$query = Users_Contact::select('*')->where($criteria);
		if ($limit) {
			$query = $query->limit($limit, $offset);
		}
		return $query->fetchDbRows();
	}

	/**
	 * Remove contact from label
	 * @method removeContact
	 * @param {string} $userId
	 * @param {string} $label
	 * @param {string} $contactId
	 * @return {boolean}
	 */
	static function removeContact($userId, $label, $contactId)
	{
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