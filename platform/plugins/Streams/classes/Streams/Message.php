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
		$skipAccess=false)
	{
		$messages = array($publisherId => array());
		$streamNames = is_string($streamName) ? array($streamName) : $streamName;
		if (!is_array($streamNames)) {
			throw new Q_Exception_WrongType(array(
				'field' => 'streamName', 
				'type' => 'string or array'
			));
		}
		foreach ($streamNames as $sn) {
			$messages[$publisherId][$sn] = $information;
		}
		list($posted, $streams) = self::postMessages($asUserId, $messages, $skipAccess);
		if (is_string($streamName)) {
			return reset($posted);
		}
		$results = array();
		foreach ($posted as $p) {
			$results[$p->streamName] = $p;
		}
		return $results;
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
	 * @return {array}
	 *  Returns an array(array(Streams_Message), array(Streams_Stream))
	 */
	static function postMessages(
		$asUserId, 
		$messages, 
		$skipAccess = false)
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
		$eventParams = array();
		$posted = array();
		$streams = array();
		$messages2 = array();
		$totals2 = array();
		$clientId = Q_Request::special('clientId', '');
		foreach ($messages as $publisherId => $arr) {
			$streamNames = array_keys($messages[$publisherId]);
			$streams[$publisherId] = $fetched = Streams::fetch(
				$asUserId, $publisherId, $streamNames, '*', 
				array('refetch' => true, 'begin' => true) // lock for updates
			);
			foreach ($arr as $streamName => $message) {
				$p = &$posted[$publisherId][$streamName];
				$p = false;
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
				$byClientId = $message['byClientId'];
				
				// Get the Streams_Stream object
				if (!isset($fetched[$streamName])) {
					$p = new Q_Exception_MissingRow(array(
						'table' => 'stream',
						'criteria' => "publisherId $publisherId and name $streamName"
					));
					continue;
				}
				$stream = $fetched[$streamName];
				
				// Make a Streams_Message object
				$message = new Streams_Message();
				$message->publisherId = $publisherId;
				$message->streamName = $streamName;
				$message->insertedTime = new Db_Expression("CURRENT_TIMESTAMP");
				$message->sentTime = new Db_Expression("CURRENT_TIMESTAMP");
				$message->byUserId = $asUserId;
				$message->byClientId = $byClientId ? substr($byClientId, 0, 31) : '';
				$message->type = $type;
				$message->content = $content;
				$message->instructions = $instructions;
				$message->weight = $weight;
				$message->ordinal = $stream->messageCount + 1; // thanks to transaction
				
				// Set up some parameters for the event hooks
				$sendToNode = true;
				$eventParams[$publisherId][$streamName] = array(
					'publisherId' => $publisherId,
					'message' => $message,
					'skipAccess' => $skipAccess,
					'sendToNode' => &$sendToNode, // sending to node can be canceled
					'stream' => $stream
				);
				$params = &$eventParams[$publisherId][$streamName];
				
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
				
				if (!$skipAccess && !$stream->testWriteLevel('post')) {
					$p = new Users_Exception_NotAuthorized();
					/**
					 * @event Streams/notAuthorized {before}
					 * @param {string} 'publisherId'
					 * @param {Streams_Stream} 'stream'
					 * @param {string} 'message'
					 */
					Q::event("Streams/notAuthorized", $params, 'after');
					continue;
				}

				// if we are still here, mark the message as "in the database"
				$message->wasRetrieved(true);
				$posted[$publisherId][$streamName] = $message;
				
				// build the arrays of rows to insert
				$messages2[] = $mf = $message->fields;
				$totals2[] = array(
					'publisherId' => $mf['publisherId'],
					'streamName' => $mf['streamName'],
					'messageType' => $mf['type'],
					'messageCount' => 1
				);
			}
		}

		if ($totals2) {
			Streams_Total::insertManyAndExecute($totals2, array(
				'onDuplicateKeyUpdate' => array(
					'messageCount' => new Db_Expression('messageCount + 1')
				)
			));
		}
		if ($messages2) {
			Streams_Message::insertManyAndExecute($messages2);
		}
		
		// time to update the stream rows and commit the transaction
		// (on all the shards where the streams and related rows are)
		Streams_Stream::update()
			->set(array(
				'messageCount' => new Db_Expression("messageCount+1")
			))->where(array(
				'publisherId' => $publisherId,
				'name' => $streamNames
			))->commit()
			->execute();
		
		// Handle all the events for successfully posting
		foreach ($posted as $publisherId => $arr) {
			foreach ($arr as $streamName => $m) {
				$message = $posted[$publisherId][$streamName];
				$params = $eventParams[$publisherId][$streamName];
				
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
			}
		}
		/**
		 * @event Streams/postMessages {after}
		 * @param {string} 'publisherId'
		 * @param {Streams_Stream} 'stream'
		 * @param {string} 'posted'
		 */
		Q::event("Streams/postMessages", array(
			'streams' => $streams,
			'messages' => $messages,
			'skipAccess' => $skipAccess,
			'posted' => $posted
		), 'after', false, $result);
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