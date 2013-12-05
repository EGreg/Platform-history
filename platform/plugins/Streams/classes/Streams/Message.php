<?php
/**
 * @module Streams
 */
/**
 * Class representing 'Message' rows in the 'Streams' database
 * You can create an object of this class either to
 * access its non-static methods, or to actually
 * represent a message row in the Streams database.
 *
 * @class Streams_Message
 * @extends Base_Streams_Message
 */
class Streams_Message extends Base_Streams_Message
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
	 * Convert message object to array safe to show to a user
	 * @method exportArray()
	 * @param {array} $options=null
	 * @return {array}
	 */
	function exportArray($options = null) {
		return $this->toArray();
	}
	
	/**
	 * Post message to the stream.
	 * TODO: Move it to Streams_Message::post, see skype for the other functions too.
	 * @method post
	 * @static
	 * @param {string} $asUserId
	 *  The user to post as
	 * @param {string} $publisherId
	 *  The publisher of the stream
	 * @param {string|array} $streamName
	 *  The name of the stream.
	 *  You can also pass an array of stream names here.
	 * @param {array} $information
	 *  The fields of the message. Also may include 'streamNames' field which is an array of additional
	 *  names of the streams to post message to.
	 * @param {booleam} $skip_access=false
	 *  If true, skips the access checks and just posts the message.
	 * @param {array} $streams=null
	 *  Pass an array of Streams_Stream objects here to skip having to fetch them again.
	 * @return {Streams_Message|array|false}
	 *  If not successful, returns false
	 *  If successful, returns the Streams_Message that was posted.
	 *  If $streamName was an array, then this function returns
	 *  the array of results, each value being a posted message or false if posting was aborted
	 */
	static function post(
		$asUserId, 
		$publisherId,
		$streamName,
		$information,
		$skip_access=false,
		$streams = null)
	{
		$type = Q::ifset($information, 'type', 'text/small');
		$content = Q::ifset($information, 'content', '');
		$instructions = Q::ifset($information, 'instructions', '');
		$weight = Q::ifset($information, 'weight', 1);
		
		if (is_array($instructions)) {
			$instructions = Q::json_encode($instructions);
		}

		if (isset($information['reOrdinal'])) {
			$reOrdinal = $information['reOrdinal'];
			$m = new Streams_Message();
			$m->publisherId = $publisherId;
			$m->ordinal = $reOrdinal;
			if (!$m->retrieve()) {
				throw new Q_Exception_MissingRow(array(
					'table' => 'message',
					'criteria' => "{publisherId: '$publisherId', ordinal: '$reOrdinal'}"
				));
			}
		}

		// If there are any other streams, add their names
		// You can post a message to multiple streams as long as they're by the same publisher.
		$streamNames = array($streamName);
		if (isset($information['streamNames']) and is_array($information['streamNames'])) {
			$streamNames = array_merge($streamNames, $information['streamNames']);
		}

		// Post the message to the streams:
		$results = array();
		if (empty($streams)) {
			$streams = array();
			foreach ($streamNames as $streamName) {
				$s = Streams::fetchOne($asUserId, $publisherId, $streamName);
				if (!$s) {
					throw new Q_Exception_MissingRow(array(
						'table' => 'stream',
						'criteria' => "{publisherId: '$publisherId', name: '$streamName'}"
					));
				}
				$streams[] = $s;
			}
		}
		foreach ($streams as $stream) {
			if (!$skip_access
			and $asUserId != $publisherId
			and !$stream->testWriteLevel('post')) {
				throw new Users_Exception_NotAuthorized();
			}

			$message = new Streams_Message();
			$message->publisherId = $publisherId;
			$message->streamName = $stream->name;
			$message->sentTime = new Db_Expression("CURRENT_TIMESTAMP");
			$message->byUserId = $asUserId;
			$message->type = $type;
			$message->content = $content;
			$message->instructions = $instructions;
			$message->weight = $weight;

			if (!empty($reOrdinal)) {
				$message->reOrdinal = $reOrdinal;
			}

			$send_to_node = true;
			$params = compact('publisherId', 'stream', 'message');
			$params['send_to_node'] = &$send_to_node;

			/**
			 * @event Streams/post/$streamType {before}
			 * @param {string} 'publisherId'
			 * @param {Streams_Stream} 'stream'
			 * @param {string} 'message'
			 * @return {false} To cancel further processing
			 */
			if (Q::event("Streams/post/{$stream->type}", $params, 'before') === false) {
				$results[$stream->name] = false;
				continue;
			}
			
			/**
			 * @event Streams/message/$messageType {before}
			 * @param {string} 'publisherId'
			 * @param {Streams_Stream} 'stream'
			 * @param {string} 'message'
			 * @return {false} To cancel further processing
			 */
			if (Q::event("Streams/message/{$type}", $params, 'before') === false) {
				$results[$stream->name] = false;
				continue;
			}

			$result = $message->save() ? $message : false; // also updates stream row
			
			// Send a message to Node
			if ($result && $send_to_node) {
				Q_Utils::sendToNode(array(
					"Q/method" => "Streams/Message/post",
					"message" => Q::json_encode($message->toArray()),
					"stream" => Q::json_encode($stream->toArray())
				));
			}
			
			/**
			 * @event Streams/message/$messageType {after}
			 * @param {string} 'publisherId'
			 * @param {Streams_Stream} 'stream'
			 * @param {string} 'message'
			 */
			Q::event("Streams/message/{$message->type}", $params, 'after', false, $result);
			/**
			 * @event Streams/post/$streamType {after}
			 * @param {string} 'publisherId'
			 * @param {Streams_Stream} 'stream'
			 * @param {string} 'message'
			 */
			Q::event("Streams/post/{$stream->type}", $params, 'after', false, $result);

			$results[$stream->name] = $result;
		}

		/*
		// Send notifications	
		$subscriptions = Streams_Subscription::select('*')
		->where(array('toStreamName' => $streamName))
		->andWhere(array('toPublisherId' => $publisherId), array('toPublisherId' => 0))

		// notify aggregators, etc.
		// but how to access people's private contacts? you can't.
		// you can only send it to people who subscribed to 0 and told YOU about it
		*/
		
		if (is_array($streamName)) {
			return $results;
		} else {
			$result = reset($results);
			return $result ? $result : false;
		}
	}
	
	function getAllInstructions()
	{
		return empty($this->instructions) ? array() : json_decode($this->instructions, true);
	}
	
	function getInstruction($instruction_name)
	{
		$instr = $this->getAllInstructions();
		return isset($instr[$instruction_name]) ? $instr[$instruction_name] : null;
	}
	
	function setInstruction($instruction_name, $value)
	{
		$instr = $this->getAllInstructions();
		$instr[$instruction_name] = $value;
		$this->instructions = Q::json_encode($instr);
	}
	
	function clearInstruction($instruction_name)
	{
		$instr = $this->getAllInstructions();
		unset($instr[$instruction_name]);
		$this->instructions = Q::json_encode($instr);
	}

	/**
	 * Assigns ordinal
	 * @method beforeSave
	 * @param {array} $value
	 *	The row beind saved
	 * @return {array}
	 */
	function beforeSave($value)
	{
		if ($this->retrieved) {
			return parent::beforeSave($value);
		}
		$stream = new Streams_Stream();
		$stream->publisherId = $value['publisherId'];
		$stream->name = $value['streamName'];
		if (!$stream->retrieve('*', true, array('begin'=>true))) {
			// no one should post messages to nonexistent streams
			throw new Q_Exception("Cannot post message to nonexistent stream");
		}
		$this->ordinal = ++$stream->messageCount;
		$value['ordinal'] = $this->ordinal;
		$stream->save(false, true);

		$total = new Streams_Total();
		$total->publisherId = $this->publisherId;
		$total->streamName = $this->streamName;
		$total->messageType = $this->type;
		$total->messageCount = 1;
		$total->save(array(
			'messageCount' => new Db_Expression('messageCount+1')
		));
		return parent::beforeSave($value);
	}
	
	/* * * */
	/**
	 * Implements the __set_state method, so it can work with
	 * with var_export and be re-imported successfully.
	 * @method __set_state
	 * @param {array} $array
	 * @return {Streams_Message} Class instance
	 */
	static function __set_state(array $array) {
		$result = new Streams_Message();
		foreach($array as $k => $v)
			$result->$k = $v;
		return $result;
	}
};