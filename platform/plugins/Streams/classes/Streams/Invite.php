<?php
/**
 * @module Streams
 */
/**
 * Class representing 'Invite' rows in the 'Streams' database
 * You can create an object of this class either to
 * access its non-static methods, or to actually
 * represent a invite row in the Streams database.
 *
 * @class Streams_Invite
 * @extends Base_Streams_Invite
 */
class Streams_Invite extends Base_Streams_Invite
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
	 * Accept the invite and set up user's access levels
	 * If invite was already accepted, this function simply returns null
	 * @method accept
	 * @return {Streams_Participant|false|null}
	 */
	function accept()
	{
		if ($this->state === 'accepted') {
			return null;
		}

		/**
		 * @event Streams/invite {before}
		 * @param {Streams_Invite} 'stream'
		 * @param {Users_User} 'user'
		 */
		$invite = $this;
		if (Q::event("Streams/invite/accept", compact('invite'), 'before') === false) return false;

		$this->state = 'accepted';
		if (!$this->save()) {
			return false;
		}
		
		$p = new Streams_Participant();
		$p->publisherId = $this->publisherId; // shouldn't change
		$p->streamName = $this->streamName; // shouldn't change
		$p->userId = $this->userId; // shouldn't change
		$p->state = 'participating'; // since invite was accepted, user has begun participating in the stream
		$p->reason = Q_Config::get('Streams', 'invites', 'participantReason', 'Was invited');
		$p->save(true);
		
		/**
		 * @event Streams/invite {after}
		 * @param {Streams_Invite} 'stream'
		 * @param {Users_User} 'user'
		 */
		Q::event("Streams/invite/accept", compact('invite'), 'after');

		return true;
	}
	
	function decline()
	{
		$this->state = 'declined';
		$this->save();
	}

	/**
	 * Retrieves invite
	 * @method getInvite
	 * @static
	 * @param {string} $token
	 * @return {Streams_Invite|null}
	 */

	static function fromToken ($token) {
		if (empty($token)) {
			return null;
		}
		if (!empty(self::$cache['getInvite'][$token])) {
			return self::$cache['getInvite'][$token];
		}
		$invite = new Streams_Invite();
		$invite->token = $token;
		if (!$invite->retrieve()) {
			return null;
		}
		self::$cache['getInvite'][$token] = $invite;
		return $invite;
	}

	/**
	 * Assigns unique id to 'token' field if not set
	 * Saves corresponding row in Streams_Invited table
	 * Inserting a new invite affects corresponding row in Streams_Participant table
	 * @method beforeSave
	 * @param {array} $modified_fields
	 *	The fields that have been modified
	 * @return {array}
	 */
	function beforeSave($modified_fields)
	{
		if (!$this->retrieved) {
			if (!isset($modified_fields['token'])) {
				$this->token = $modified_fields['token'] = self::db()->uniqueId(
					self::table(),
					'token',
					array(
						'length' => Q_Config::get('Streams', 'invites', 'tokens', 'length', 16),
						'characters' => Q_Config::get('Streams', 'invites', 'tokens', 'characters', 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz')
					)
				);
			}
			$p = new Streams_Participant();
			$p->publisherId = $modified_fields['publisherId'];
			$p->streamName = $modified_fields['streamName'];
			$p->userId = $modified_fields['userId'];
			if (!$p->retrieve()) {
				$p->state = 'invited';
				$p->reason = '';
				$p->save();
			}
		}

		if (array_key_exists('state', $modified_fields) or array_key_exists('expireTime', $modified_fields)) {
			$invited = new Streams_Invited();
			$invited->userId = $this->userId; // shouldn't change
			$invited->token = $this->token; // shouldn't change
			if (array_key_exists('state', $modified_fields)) {
				$invited->state = $modified_fields['state'];
			}
			if (array_key_exists('expireTime', $modified_fields)) {
				$invited->expireTime = $modified_fields['expireTime'];
			}
			$invited->save(true);
		}
		
		return parent::beforeSave($modified_fields);
	}
	
	/**
	 * Also removes counterpart row in Streams_Invited table
	 * @method beforeSave
	 * @param {array} $pk
	 *	The primary key fields
	 * @return {boolean}
	 */
	function beforeRemove($pk)
	{
		$invited = new Streams_Invited();
		$invited->userId = $this->userId;
		$invited->token = $this->token;
		$invited->remove();
		return true;
	}
	
	static protected $cache = array();

	/* * * */
	/**
	 * Implements the __set_state method, so it can work with
	 * with var_export and be re-imported successfully.
	 * @method __set_state
	 * @param {array} $array
	 * @return {Streams_Invite} Class instance
	 */
	static function __set_state(array $array) {
		$result = new Streams_Invite();
		foreach($array as $k => $v)
			$result->$k = $v;
		return $result;
	}
};