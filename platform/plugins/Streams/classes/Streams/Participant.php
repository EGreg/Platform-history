<?php
/**
 * @module Streams
 */
/**
 * Class representing 'Participant' rows in the 'Streams' database
 * You can create an object of this class either to
 * access its non-static methods, or to actually
 * represent a participant row in the Streams database.
 *
 * @class Streams_Participant
 * @extends Base_Streams_Participant
 */
class Streams_Participant extends Base_Streams_Participant
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
	 * Get an array of users participating in the stream
	 * @method getUsers
	 * @param $publisherId {string}
	 * @param $streamName {string}
	 * @return {array}
	 *	An array of user ids 
	 */
	static function getUsers($publisherId, $streamName) {
		return Streams_Participant::select('userId')
			->where(array(
				'publisherId' => $publisherId,
				'streamName' => $streamName
			))->fetchAll(PDO::FETCH_COLUMN);
	}

	/**
	 * Filter out users which are or are not participants
	 * @method filter
	 * @static
	 * @param {array} $userIds
	 * @param {Streams_Stream} $stream
	 * @param {boolean} $participate=false
	 * @return {array}
	 */
	static function filter($userIds, $stream, $participate=false) {
		$p = array_keys(Streams_Participant::select('*')->where(array(
			'publisherId' => $stream->publisherId,
			'streamName' => $stream->name,
			'userId' => $userIds,
			'state' => 'participating'
		))->fetchDbRows(null, '', 'userId'));
		return $participate ? $p : array_diff($userIds, $p);
	}

	/**
	 * Convert participant object to array safe to show to a user
	 * @method exportArray()
	 * @param {array} $options=null
	 * @return {array}
	 */
	function exportArray($options = null) {
		return $this->toArray();
	}
	
	/**
	 * Also saves counterpart row in Streams_Participating table
	 * @method beforeSave
	 * @param {array} $modifiedFields
	 *	The fields that were modified
	 * @return {array}
	 */
	function beforeSave($modifiedFields)
	{
		if (isset($modifiedFields['state'])) {
			$p = new Streams_Participating();
			$p->userId = $this->userId; // shouldn't change
			$p->publisherId = $this->publisherId; // shouldn't change
			$p->streamName = $this->streamName; // shouldn't change
			$p->state = $modifiedFields['state'];
			$p->save(true);
		}
		return parent::beforeSave($modifiedFields);
	}
	
	/**
	 * Also removes counterpart row in Streams_Participating table
	 * @method beforeSave
	 * @param {array} $pk
	 *	The primary key fields
	 * @return {boolean}
	 */
	function beforeRemove($pk)
	{
		$p = new Streams_Participating();
		$p->userId = $this->userId;
		$p->publisherId = $this->publisherId;
		$p->streamName = $this->streamName;
		$p->remove();
		return true;
	}

	/* * * */
	/**
	 * Implements the __set_state method, so it can work with
	 * with var_export and be re-imported successfully.
	 * @method __set_state
	 * @param {array} $array
	 * @return {Streams_Participant} Class instance
	 */
	static function __set_state(array $array) {
		$result = new Streams_Participant();
		foreach($array as $k => $v)
			$result->$k = $v;
		return $result;
	}
};