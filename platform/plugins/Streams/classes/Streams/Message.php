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
	 * @method exportArray
	 * @param {array} $options=null
	 * @return {array}
	 */
	function exportArray($options = null) {
		$result = $this->toArray();
		$result['clientId'] = !empty($result['clientId'])
			? sha1($result['clientId'])
			: '';
		return $result;
	}
	
	/**
	 * Post message to the stream.
	 * @method post
	 * @static
	 * @param {string} $asUserId
	 *  The user to post the message as
	 * @param {string} $publisherId
	 *  The publisher of the stream
	 * @param {string|array} $streamName
	 *  The name of the stream.
	 *  You can also pass an array of stream names here.
	 * @param {array} $information
	 *  The fields of the message. Also may include 'streamNames' field which is an array of additional
	 *  names of the streams to post message to.
	 * @param {booleam} $skipAccess=false
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
		$skipAccess=false,
		$streams = null)
	{
		if (!isset($asUserId)) {
			$asUserId = Users::loggedInUser();
			if (!$asUserId) $asUserId = "";
		}
		if ($asUserId instanceof Users_User) {
			$asUserId = $asUserId->id;
		}
		if ($publisherId instanceof Users_User) {
			$publisherId = $publisherId->id;
		}

		$type = Q::ifset($information, 'type', 'text/small');
		$content = Q::ifset($information, 'content', '');
		$instructions = Q::ifset($information, 'instructions', '');
		$weight = Q::ifset($information, 'weight', 1);
		
		if (!isset($information['byClientId'])) {
			$clientId = Q_Request::special('clientId', '');
			$information['byClientId'] = $clientId ? substr($clientId, 0, 255) : '';
		}
		
		if (is_array($instructions)) {
			$instructions = Q::json_encode($instructions);
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
			$streams = Streams::fetch($asUserId, $publisherId, $streamNames);
			foreach ($streams as $s) {
				if (!$s) {
					$streamName = $s->name;
					throw new Q_Exception_MissingRow(array(
						'table' => 'stream',
						'criteria' => "{publisherId: '$publisherId', name: '$streamName'}"
					));
				}
			}
		}
		foreach ($streams as $stream) {
			if (!$skipAccess
			and $asUserId != $publisherId
			and !$stream->testWriteLevel('post')) {
				throw new Users_Exception_NotAuthorized();
			}

			$message = new Streams_Message();
			$message->publisherId = $publisherId;
			$message->streamName = $stream->name;
			$message->sentTime = new Db_Expression("CURRENT_TIMESTAMP");
			$message->byUserId = $asUserId;
			$clientId = Q::ifset($information, 'byClientId', '');
			$message->byClientId = $clientId ? substr($clientId, 0, 31) : '';
			$message->type = $type;
			$message->content = $content;
			$message->instructions = $instructions;
			$message->weight = $weight;

			$sendToNode = true;
			$params = compact('publisherId', 'stream', 'message');
			$params['sendToNode'] = &$sendToNode;

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
			if ($result && $sendToNode) {
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
	
	/**
	 * Post (potentially) multiple messages to multiple streams.
	 * With one call to this function you can post at most one message per stream.
	 * @static
	 * @param {string} $asUserId
	 *  The user to post the message as
	 * @param {string} $messages
	 *  Array indexed as follows:
	 *  array($publisherId => array($streamName => $message))
	 *  where $message are either Streams_Message objects, 
	 *  or arrays containing all the fields of messages that will need to be posted.
	 * @param {booleam} $skipAccess=false
	 *  If true, skips the access checks and just posts the message.
	 * @param {array} $streams=null
	 *  Pass an array of Streams_Stream objects here to skip having to fetch them again.
	 *  This array should be indexed by []$publisherId][$name].
	 * @return {array}
	 *  Returns an array(array(Streams_Message), array(Streams_Stream))
	 */
	static function postMessages(
		$asUserId, 
		$messages, 
		$skipAccess = false,
		$streams = null)
	{
		if (!isset($asUserId)) {
			$asUserId = Users::loggedInUser();
			if (!$asUserId) $asUserId = "";
		}
		if ($asUserId instanceof Users_User) {
			$asUserId = $asUserId->id;
		}
		
		// Build arrays we will need
		foreach ($messages as $publisherId => $arr) {
			if (!is_array($arr)) {
				throw new Q_Exception_WrongType(array(
					'field' => "messages",
					'type' => 'array of publisherId => streamName => message'
				));
			}
			foreach ($arr as $streamName => &$message) {
				if (!is_array($message)) {
					if (!($message instanceof Streams_Message)) {
						throw new Q_Exception_WrongType(array(
							'field' => "message under $publisherId => $streamName",
							'type' => 'array or Streams_Message'
						));
					}
					$message = $message->fields;
				}
			}
		}
		
		// Start posting messages, publisher by publisher
		$toInsert = array();
		$clientId = Q_Request::special('clientId', '');
		foreach ($messages as $publisherId => $arr) {
			$streamNames = array_keys($messages[$publisherId]);
			$fetched = Streams_Stream::fetch(
				$asUserId, $publisherId, $streamNames, '*', 
				array('begin' => array(true)) // lock for updates
			);
			$p = &$posted[$publisherId][$streamNames];
			$p = false;
			foreach ($arr as $streamName => $message) {
				$type = isset($message['type']) ? $message['type'] : 'text/small';
				$content = isset($message['content']) ? $message['content'] : '';
				$instructions = isset($message['instructions']) ? $message['instructions'] : '';
				$weight = isset($message['weight']) ? $message['weight'] : 1;;
				if (!isset($message['byClientId'])) {
					$message['byClientId'] = $clientId ? substr($clientId, 0, 255) : '';
				}
				if (is_array($instructions)) {
					$instructions = Q::json_encode($instructions);
				}
				if (!$skipAccess && !$stream->testWriteLevel('post')) {
					$p = new Users_Exception_NotAuthorized();
				}
				$byClientId = $message['byClientId'];
				
				// Get the Streams_Stream object
				$stream = $fetched[$streamName];
				
				// Make a Streams_Message object
				$message = new Streams_Message();
				$message->publisherId = $publisherId;
				$message->streamName = $streamName;
				$message->sentTime = new Db_Expression("CURRENT_TIMESTAMP");
				$message->byUserId = $asUserId;
				$message->byClientId = $byClientId ? substr($byClientId, 0, 31) : '';
				$message->type = $type;
				$message->content = $content;
				$message->instructions = $instructions;
				$message->weight = $weight;
				
				$sendToNode = true;
				$params = compact('publisherId', 'stream', 'message');
				$params['sendToNode'] = &$sendToNode; // sending to node can be canceled
				
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

				// if we are still here, then add the event to the array
				$posted[] = $message->fields;
			}
		
			//
			// insertManyAndExecute
			//
			// INSERT INTO total (`publisherId`, `streamName`, `messageType`, `messageCount`)
			// VALUES ($publisherId1, $streamName1, messageType, 1),
			// VALUES ($publisherId2, $streamName2, messageType, 1)
			// VALUES ($publisherId3, $streamName3, messageType, 1)
			// ON DUPLICATE KEY UPDATE `publisherId`=publisherId, ..., `messageCount` = messageCount+1
	
			// INSERT INTO streams_message (`publisherId`, `streamName`, `sentTime`, `byUserId`, `byClientId`, `type`, `content`, `instructions`, `weight`, `ordinal`)
			// VALUES (..., $ordinal1),
			// VALUES (..., $ordinal2)
				
			$posted = array();
			
			Streams_Stream::update()
				->set(array(
					'messageCount' => new Db_Expression("messageCount+1")
				))->where(array(
					'publisherId' => $publisherId,
					'streamName' => $streamNames
				))->commit()
				->execute();
		}
		return array($posted, $streams);
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
	 *	The row being saved
	 * @return {array}
	 */
	function beforeSave($value)
	{
		if ($this->retrieved) {
			return parent::beforeSave($value);
		}
		$asUserId = isset($this->byUserId) ? $this->byUserId : $value['byUserId'];
		$publisherId = isset($this->publisherId) ? $this->publisherId : $value['publisherId'];
		$streamName = isset($this->streamName) ? $this->streamName : $value['streamName'];
		$stream = Streams::fetchOne($asUserId, $publisherId, $streamName, '*', array(
			'refetch' => true,
			'begin' => true
		));
		if (!$stream) {
			// no one should post messages to nonexistent streams
			throw new Q_Exception("Cannot post message to nonexistent stream");
		}
		$this->ordinal = ++$stream->messageCount;
		$value['ordinal'] = $this->ordinal;
		$stream->save(false);

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
	
	function beforeSaveExecute($query)
	{
		return $query->commit(); // make this query commit
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