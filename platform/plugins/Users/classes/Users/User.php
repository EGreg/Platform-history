<?php
/**
 * @module Users
 */
/**
 * Class representing 'User' rows in the 'Users' database
 * You can create an object of this class either to
 * access its non-static methods, or to actually
 * represent a user row in the Users database.
 *
 * @class Users_User
 * @extends Base_Users_User
 */
class Users_User extends Base_Users_User
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
	 * Retrieves user by id
	 * @method getUser
	 * @static
	 * @param {string} $userId
	 * @param {boolean} [$throw_if_missing=false] If true, throws an exception if the user can't be fetched
	 * @return {Users_User|null}
	 * @throws {Users_Exception_NoSuchUser} If the URI contains an invalid "username"
	 */
	static function getUser ($userId, $throw_if_missing = false)
	{
		if (empty($userId)) {
			$result = null;
		} else if (!empty(self::$cache['getUser'][$userId])) {
			$result = self::$cache['getUser'][$userId];
		} else {
			$user = new Users_User();
			$user->id = $userId;
			if (!$user->retrieve()) {
				$user = null;
			}
			self::$cache['getUser'][$userId] = $user;
		 	$result = $user;
		}
		if (!$result and $throw_if_missing) {
			throw new Users_Exception_NoSuchUser();
		}
		return $result;
	}

	/**
	 * @method exportArray
	 * @return {array}
	 */
	function exportArray()
	{
		$safe = Q_Config::expect('Users', 'safeFields');
		$u = array();
		foreach ($this->fields as $field => $value) {
			if (in_array($field, $safe)) {
				$u[$field] = $value;
			}
		}
		return $u;
	}
	
	/**
	 * Use this function to display the name of a user object
	 */
	function displayName($options = array())
	{
		$user = $this;
 		$name = Q::event('Users/User/displayName', compact('user', 'options'), 'before');
		return isset($name) ? $name : $this->username;
	}
	
	/**
	 * @method beforeSet_username
	 * @param {string} $username
	 * @return {array}
	 */
	function beforeSet_username($username)
	{
		parent::beforeSet_username($username);
		if (!isset($username)) {
			return array('username', $username);
		}
		/**
		 * @event Users/validate/username
		 * @param {&string} 'username'
		 */
		Q::event(
			'Users/validate/username',
			array('username' => & $username)
		);
		return array('username', $username);
	}
	
	/**
	 * @method beforeSet_emailAddress
	 * @param {string} $emailAddress
	 * @return {array}
	 */
	function beforeSet_emailAddress($emailAddress)
	{
		parent::beforeSet_emailAddress($emailAddress);
		/**
		 * @event Users/validate/emailAddress
		 * @param {&string} 'emailAddress'
		 */
		Q::event(
			'Users/validate/emailAddress',
			array('emailAddress' => & $emailAddress)
		);
		if (!isset($emailAddress)) {
			return array('emailAddress', $emailAddress);
		}
		return array('emailAddress', $emailAddress);
	}
	
	/**
	 * @method idFilter
	 * @param {string} $params
	 * @return {boolean}
	 */
	static function idFilter($params)
	{
		/**
		 * @event Users/filter/id
		 * @param {string} 'id'
		 * @return {boolean}
		 */
		return Q::event('Users/filter/id', $params);
	}
	
	/**
	 * Assigns 'id' and verifies 'username' fields
	 * @method beforeSave
	 * @param {array} $modified_fields
	 * @return {array}
	 * @throws {Users_Exception_UsernameExists}
	 *	If username already exists
	 */
	function beforeSave($updated_fields)
	{
		if (!$this->retrieved) {
			if (!isset($updated_fields['id'])) {
				$this->id = $updated_fields['id'] = 
				self::db()->uniqueId(self::table(), 'id', null, array(
					'characters' => 'abcdefghijklmnopqrstuvwxyz',
					'length' => 8,
					'filter' => array('Users_User', 'idFilter')
				));
			}
			if (!isset($updated_fields['username'])) {
				// put an empty username for now
				$this->username = $updated_fields['username'] = '';
			}
		}
		if (!empty($updated_fields['username'])) {
			$app = Q_Config::expect('Q', 'app');
			$unique = Q_Config::get('Users', 'model', $app, 'username_unique', true);
			if ($unique) {
				$username = $updated_fields['username'];
				$criteria = compact('username');
				if (isset($this->id)) {
					$criteria['id != '] = $this->id;
				}
				$rows = Users_User::select('COUNT(1)')
					->where($criteria)->limit(1)
					->fetchAll(PDO::FETCH_NUM);
				$row = $rows[0];
				if ($row[0] > 0) {
					throw new Users_Exception_UsernameExists($criteria, 'username');
				}
			}
		}
		$user = $this;
		Q::event(
			'Users/User/save', 
			compact('user', 'updated_fields'),
			'before'
		);
		return parent::beforeSave($updated_fields);
	}
	
	function afterSaveExecute($result, $query, $modified_fields, $where)
	{
		$user = $this;
		Q::event(
			'Users/User/save', 
			compact('user', 'result', 'query', 'modified_fields', 'where'),
			'after'
		);
		return $result;
	}
	
	/**
	 * @method addContact
	 * @param {string} $contactUserId
	 *  The id of the user who is the contact
	 * @param {string|array} $label
	 *  The label of the contact. This can be a string or an array of strings, in which case
	 *  multiple contact rows are saved.
	 * @throws {Q_Exception_RequiredField}
	 *	if $label is missing
	 */
	function addContact($contactUserId, $label)
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
			$contact->userId = $this->id;
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
		Q::event('Users/User/addContact', compact('contactUserId', 'label', 'contacts'), 'after');
	}
	
	/**
	 * Starts the process of adding an email to a saved user object.
	 * Also modifies and saves this user object back to the database.
	 * @method addEmail
	 * @param {string} $emailAddress
	 *  The email address to add.
	 * @param {string} [$activation_emailSubject=null]
	 *  The subject of the activation email to send.
	 * @param {string} [$activation_email_view=null]
	 *  The view to use for the body of the activation email to send.
	 * @param {boolean} [$html=true]
	 *  Defaults to true. Whether to send as HTML email.
	 * @param {array} [$fields=array()]
	 *  An array of additional fields to pass to the email view.
	 * @param {array} $options=array()
	 *  Array of options. Can include:<br/>
	 *  "html" => Defaults to false. Whether to send as HTML email.<br/>
	 *  "name" => A human-readable name in addition to the address.<br/>
	 *  "from" => An array of (emailAddress, human_readable_name)<br/>
	 *  "delay" => A delay, in milliseconds, to wait until sending email. Only works if Node server is listening.
	 * @return {boolean}
	 *  Returns true on success.
	 *  Returns false if this email address is already verified for this user.
	 * @throws {Q_Exception_WrongValue}
	 *  If the email address is in an invalid format, this is thrown.
	 * @throws {Users_Exception_AlreadyVerified}
	 *  If the email address already exists and has been verified for
	 *  another user, then this exception is thrown.
	 */
	function addEmail(
		$emailAddress,
		$activation_emailSubject = null,
		$activation_email_view = null,
		$fields = array(),
		$options = array())
	{
		if (!isset($options['html'])) {
			$options['html'] = true;
		}
		if (!Q_Valid::email($emailAddress, $normalized)) {
			throw new Q_Exception_WrongValue(array(
				'field' => 'Email', 
				'range' => 'a valid address'
			), 'emailAddress');
		}
		$email = new Users_Email();
		$email->address = $normalized;
		if ($email->retrieve('*', null, true)->ignoreCache()->resume()
		and $email->state !== 'unverified') {
			if ($email->userId === $this->id) {
				$email->set('user', $this);
				return $email;
			}
			// Otherwise, say it's verified for another user,
			// even if it unsubscribed or was suspended.
			throw new Users_Exception_AlreadyVerified(array(
				'key' => $email->address,
				'userId' => $email->userId
			), 'emailAddress');
		}
		
		$user = $this;
		
		// If we are here, then the email record either
		// doesn't exist, or hasn't been verified yet.
		// In either event, update the record in the database,
		// and re-send the email.
		$minutes = Q_Config::get('Users', 'activation', 'expires', 60*24*7);
		$email->state = 'unverified';
		$email->userId = $this->id;
		$email->activationCode = strtolower(Q_Utils::unique(5));
		$email->activationCodeExpires = new Db_Expression(
			"CURRENT_TIMESTAMP + INTERVAL $minutes MINUTE"
		);
		$email->authCode = md5(microtime() + mt_rand());
		/**
		 * @event Users/addIdentifier {before}
		 * @param {string} 'user'
		 * @param {string} 'email'
		 */
		Q::event('Users/addIdentifier', compact('user', 'email'), 'before');
		$email->save();
		
		$link = 'Users/activate?p=1&code='.urlencode($email->activationCode) . '&e='.urlencode($email->address);
		
		$this->emailAddressPending = $normalized;
		$this->save();
		
		if (!isset($activation_email_view)) {
			$activation_email_view = Q_Config::get(
				'Users', 'transactional', 'activation', 'body', 'Users/email/activation.php'
			);
		}
		if (!isset($activation_emailSubject)) {
			$activation_emailSubject = Q_Config::get(
				'Users', 'transactional', 'activation', 'subject', "Welcome! Please confirm your email address." 
			);
		}

		$fields2 = array_merge($fields, array(
			'user' => $this,
			'email' => $email,
			'app' => Q_Config::expect('Q', 'app'),
			'baseUrl' => Q_Request::baseUrl(),
			'link' => $link
		));
		$email->sendMessage(
			$activation_emailSubject, 
			$activation_email_view, 
			$fields2,
			$options
		); // may throw exception if badly configured
		
		/**
		 * @event Users/addIdentifier {after}
		 * @param {string} 'user'
		 * @param {string} 'email'
		 */
		Q::event('Users/addIdentifier', compact('user', 'email', 'link'), 'after');
	}
	
	/**
	 * @method setEmailAddress
	 * @param {string} $emailAddress
	 * @param {boolean} [$verified=false]
	 * @throws {Q_Exception_MissingRow}
	 *	If e-mail address is missing
	 * @throws {Users_Exception_AlreadyVerified}
	 *	If user is already verified
	 * @throws {Users_Exception_WrongState}
	 *	If verification state is wrong
	 */
	function setEmailAddress($emailAddress, $verified = false)
	{
		$email = new Users_Email();
		Q_Valid::email($emailAddress, $normalized);
		$email->address = $normalized;
		$retrieved = $email->retrieve('*', null, true)->ignoreCache()->resume();
		if (empty($email->activationCode)) {
			$email->activationCode = '';
			$email->activationCodeExpires = '0000-00-00 00:00:00';
		}
		$email->authCode = md5(microtime() + mt_rand());
		if ($verified) {
			$email->userId = $this->id;
		} else {
			if (!$retrieved) {
				throw new Q_Exception_MissingRow(array(
					'table' => "an email",
					'criteria' => "address $emailAddress"
				), 'emailAddress');
			}
			if ($email->userId != $this->id) {
				// We're going to tell them it's verified for someone else,
				// even though it may not have been verified yet.
				// In the future, might throw a more accurate exception.
				throw new Users_Exception_AlreadyVerified(array(
					'key' => $email->address,
					'userId' => $email->userId
				));
			}
			if (!in_array($email->state, array('unverified', 'active'))) {
				throw new Users_Exception_WrongState(array(
					'key' => $email->address,
					'state' => $email->state
				), 'emailAddress');
			}
		}

		// Everything is okay. Assign it!
		$email->state = 'active';
		$email->save();
		
		$ui = new Users_Identify();
		$ui->identifier = "email_hashed:".Q_Utils::hash($normalized);
		$ui->state = 'verified';
		$ui->userId = $this->id;
		$ui->save(true);

		$this->emailAddressPending = '';
		$this->emailAddress = $emailAddress;
		$this->save();
		$user = $this;
		
		Q_Response::removeNotice('Users/email');
		
		/**
		 * @event Users/setEmailAddress {after}
		 * @param {string} 'user'
		 * @param {string} 'email'
		 */
		Q::event('Users/setEmailAddress', compact('user', 'email'), 'after');
		return true;
	}
	
	/**
	 * Starts the process of adding a mobile to a saved user object.
	 * Also modifies and saves this user object back to the database.
	 * @method addMobile
	 * @param {string} $mobileNumber
	 *  The mobile number to add.
	 * @param {string} [$activation_message_view=null]
	 *  The view to use for the body of the activation message to send.
	 * @param {array} [$fields=array()]
	 *  An array of additional fields to pass to the mobile view.
	 * @param {array} $options=array()
	 *  Array of options. Can include:<br/>
	 *  "delay" => A delay, in milliseconds, to wait until sending email. Only works if Node server is listening.
	 * @return {boolean}
	 *  Returns true on success.
	 *  Returns false if this mobile number is already verified for this user.
	 * @throws {Q_Exception_WrongValue}
	 *  If the mobile number is in an invalid format, this is thrown.
	 * @throws {Users_Exception_AlreadyVerified}
	 *  If the mobile number already exists and has been verified for
	 *  another user, then this exception is thrown.
	 */
	function addMobile(
		$mobileNumber,
		$activation_message_view = null,
		$fields = array(),
		$options = array())
	{
		if (!Q_Valid::phone($mobileNumber, $normalized)) {
			throw new Q_Exception_WrongValue(array(
				'field' => 'Mobile phone', 
				'range' => 'a valid number'
			), 'mobileNumber');
		}
		$mobile = new Users_Mobile();
		$mobile->number = $normalized;
		if ($mobile->retrieve('*', null, true)->ignoreCache()->resume()
		and $mobile->state !== 'unverified') {
			if ($mobile->userId === $this->id) {
				$mobile->set('user', $this);
				return $mobile;
			}
			// Otherwise, say it's verified for another user,
			// even if it unsubscribed or was suspended.
			throw new Users_Exception_AlreadyVerified(array(
				'key' => $mobile->number,
				'userId' => $mobile->userId
			), 'mobileNumber');
		}
		
		$user = $this;
		
		// If we are here, then the mobile record either
		// doesn't exist, or hasn't been verified yet.
		// In either event, update the record in the database,
		// and re-send the mobile.
		$minutes = Q_Config::get('Users', 'activation', 'expires', 60*24*7);
		$mobile->state = 'unverified';
		$mobile->userId = $this->id;
		$mobile->activationCode = strtolower(Q_Utils::unique(5));
		$mobile->activationCodeExpires = new Db_Expression(
			"CURRENT_TIMESTAMP + INTERVAL $minutes MINUTE"
		);
		$mobile->authCode = md5(microtime() + mt_rand());
		/**
		 * @event Users/addIdentifier {before}
		 * @param {string} 'user'
		 * @param {string} 'mobile'
		 */
		Q::event('Users/addIdentifier', compact('user', 'mobile'), 'before');
		$mobile->save();
		
		$link = 'Users/activate?p=1&code='.urlencode($mobile->activationCode) . '&m='.urlencode($mobile->number);
		
		$this->mobileNumberPending = $normalized;
		$this->save();
		
		if (!isset($activation_message_view)) {
			$activation_message_view = Q_Config::get(
				'Users', 'transactional', 'activation', 'sms', 'Users/sms/activation.php'
			);
		}

		$fields2 = array_merge($fields, array(
			'user' => $this,
			'mobile' => $mobile,
			'app' => Q_Config::expect('Q', 'app'),
			'baseUrl' => Q_Request::baseUrl(),
			'link' => $link
		));
		$mobile->sendMessage(
			$activation_message_view, 
			$fields2,
			$options
		);
		
		Q_Response::removeNotice('Users/mobile');
		
		/**
		 * @event Users/addIdentifier {after}
		 * @param {string} 'user'
		 * @param {string} 'mobile'
		 */
		Q::event('Users/addIdentifier', compact('user', 'mobile', 'link'), 'after');
	}
	
	/**
	 * @method setMobileNumber
	 * @param {string} $mobileNumber
	 * @param {boolean} [$verified=false]
	 * @throws {Q_Exception_MissingRow}
	 *	If mobile number is missing
	 * @throws {Users_Exception_AlreadyVerified}
	 *	If user was already verified
	 * @throws {Users_Exception_WrongState}
	 *	If verification state is wrong
	 */
	function setMobileNumber($mobileNumber, $verified = false)
	{
		Q_Valid::phone($mobileNumber, $normalized);
		$mobile = new Users_Mobile();
		$mobile->number = $mobileNumber;
		$retrieved = $mobile->retrieve('*', null, true)->ignoreCache()->resume();
		if ($verified) {
			$mobile->userId = $this->id;
			if (empty($mobile->activationCode)) {
				$mobile->activationCode = '';
				$mobile->activationCodeExpires = '0000-00-00 00:00:00';
			}
			$mobile->authCode = md5(microtime() + mt_rand());
		} else {
			if (!$retrieved) {
				throw new Q_Exception_MissingRow(array(
					'table' => "a mobile phone",
					'criteria' => "number $normalized"
				), 'mobileNumber');
			}
			if ($mobile->userId != $this->id) {
				// We're going to tell them it's verified for someone else,
				// even though it may not have been verified yet.
				// In the future, might throw a more accurate exception.
				throw new Users_Exception_AlreadyVerified(array(
					'key' => $mobile->number,
					'userId' => $mobile->userId
				));
			}
			if (!in_array($mobile->state, array('unverified', 'active'))) {
				throw new Users_Exception_WrongState(array(
					'key' => $mobile->number,
					'state' => $mobile->state
				), 'mobileNumber');
			}
		}

		// Everything is okay. Assign it!
		$mobile->state = 'active';
		$mobile->save();
		
		$ui = new Users_Identify();
		$ui->identifier = "mobile_hashed:".Q_Utils::hash($normalized);
		$ui->state = 'verified';
		$ui->userId = $this->id;
		$ui->save(true);
		
		$this->mobileNumberPending = '';
		$this->mobileNumber = $normalized;
		$this->save();
		$user = $this;
		/**
		 * @event Users/setMobileNumber {after}
		 * @param {string} 'user'
		 * @param {string} 'mobile'
		 */
		Q::event('Users/setMobileNumber', compact('user', 'mobile'), 'after');
		return true;
	}
	
	/**
	 * Obtain the path of the user icon
	 * @return {string}
	 */
	function iconPath()
	{
		return "plugins/Users/img/icons/".$this->icon;
	}
	
	/**
	 * get user id
	 * @method get_id
	 * @static
	 * @private
	 * @param {Users_User} $u
	 * @return {string}
	 */
	private static function get_id ($u) { return $u->id; }
	
	/**
	 * Check label or array of labels and return existing users
	 * @method labelsToIds
	 * @static
	 * @param $asUserId {string} The user id of inviting user
	 * @param $labels {string|array}
	 * @return {array} The array of user ids
	 */
	static function labelsToIds ($asUserId, $labels) {

		if (empty($labels)) return array();

		if (!is_array($labels)) {
			$labels = array_map('trim', explode(',', $labels));
		}

		$userIds = array();
		foreach ($labels as $label) {
			$userIds = array_merge($userIds, Users_Contact::select('contactUserId')
				->where(array(
					'userId' => $asUserId,
					'label' => $label
				))->fetchAll(PDO::FETCH_COLUMN));
		}
		return $userIds;
	}

	/**
	 * Check identifier or array of identifiers and return users - existing or future
	 * @method idsFromIdentifiers
	 * @static
	 * @param $asUserId {string} The user id of inviting user
	 * @param $identifiers {string|array}
	 * @return {array} The array of user ids
	 */
	static function idsFromIdentifiers ($identifiers)
	{

		if (empty($identifiers)) return array();

		if (!is_array($identifiers)) {
			$identifiers = array_map('trim', explode(',', $identifiers));
		}

		$users = array();
		foreach ($identifiers as $identifier) {
			if (Q_Valid::email($identifier, $emailAddress)) {
				$ui_identifier = $emailAddress; 
				$type = 'email';
			} else if (Q_Valid::phone($identifier, $mobileNumber)) {
				$ui_identifier = $mobileNumber; 
				$type = 'mobile';
			} else {
				throw new Q_Exception_WrongType(array(
					'field' => 'identifier',
					'type' => 'email address or mobile number'
				), array('emailAddress', 'mobileNumber'));
			}
			$users[] = Users::futureUser($type, $ui_identifier);
		}
		return array_map(array('Users_User', 'get_id'), $users);
	}
	
	/**
	 * Check fb identifier or array of identifiers and return users - existing or future
	 * @method idsFromFacebook
	 * @static
	 * @param $asUserId {string} The user id of inviting user
	 * @param $identifiers {string|array}
	 * @return {array} The array of user ids
	 */
	static function idsFromFacebook ($identifiers)
	{

		if (empty($identifiers)) return array();

		if (!is_array($identifiers)) {
			$identifiers = array_map('trim', explode(',', $identifiers));
		}

		$users = array();
		foreach ($identifiers as $identifier) {
			$users[] = Users::futureUser('facebook', $identifier);
		}
		return array_map(array('Users_User', 'get_id'), $users);
	}

	/**
	 * Verifies that users exist for these ids
	 * @method verifyUserIds
	 * @static
	 * @param $userIds {string|array}
	 * @param $throw=false {boolean}
	 * @return {array} The array of found user ids
	 */
	static function verifyUserIds($userIds, $throw = false)
	{
		if (empty($userIds)) return array();

		if (!is_array($userIds)) {
			$userIds = array_map('trim', explode(',', $userIds));
		}
		
		$users = Users_User::select('id')
			->where(array('id' => $userIds))
			->fetchAll(PDO::FETCH_COLUMN);

		if ($throw && count($users) < count($userIds)) {	
			$diff = array_diff($userIds, $users);
			if (count($diff)) {
				$ids = join(', ', $diff);
				throw new Q_Exception_MissingRow(array(
					'table' => 'user',
					'criteria' => "ids ($ids)"
				), 'id');
			}
		}
		return $users;
	}
	
	/**
	 * @property $fetch_cache
	 * @type array
	 * @protected
	 */
	protected $fetch_cache = array();
	/**
	 * @property $cache
	 * @type array
	 * @protected
	 * @static
	 */
	protected static $cache = array();

	/* * * */
	/**
	 * Implements the __set_state method, so it can work with
	 * with var_export and be re-imported successfully.
	 * @method __set_state
	 * @param {array} $array
	 * @return {Users_User} Class instance
	 */
	static function __set_state(array $array) {
		$result = new Users_User();
		foreach($array as $k => $v)
			$result->$k = $v;
		return $result;
	}
};