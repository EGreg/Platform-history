<?php
/**
 * @module Streams
 */
/**
 * Class representing 'Stream' rows in the 'Streams' database
 * You can create an object of this class either to
 * access its non-static methods, or to actually
 * represent a stream row in the Streams database.
 *
 * @class Streams_Stream
 * @extends Base_Streams_Stream
 */
class Streams_Stream extends Base_Streams_Stream
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
	 * Defaults for stream
	 * @property $DEFAULTS
	 * @type {array}
	 * @static
	 */
	/**
	 * @config $DEFAULTS['type']
	 * @type string
	 * @default 'chat'
	 * @final
	 */
	/**
	 * @config $DEFAULTS['title']
	 * @type string
	 * @default empty
	 * @final
	 */
	/**
	 * @config $DEFAULTS['icon']
	 * @type string
	 * @default empty
	 * @final
	 */
	/**
	 * @config $DEFAULTS['content']
	 * @type string
	 * @default empty
	 * @final
	 */
	/**
	 * @config $DEFAULTS['attributes']
	 * @type string
	 * @default empty
	 * @final
	 */
	/**
	 * @config $DEFAULTS['readLevel']
	 * @type string
	 * @default Streams::$READ_LEVEL['messages']
	 * @final
	 */
	/**
	 * @config $DEFAULTS['writeLevel']
	 * @type string
	 * @default Streams::$WRITE_LEVEL['join']
	 * @final
	 */
	/**
	 * @config $DEFAULTS['adminLevel']
	 * @type string
	 * @default Streams::$ADMIN_LEVEL['invite']
	 * @final
	 */
	/**
	 * @config $DEFAULTS['messageCount']
	 * @type string
	 * @default 0
	 * @final
	 */
	/**
	 * @config $DEFAULTS['participantCount']
	 * @type string
	 * @default 0
	 * @final
	 */
	public static $DEFAULTS = array(
		'type' => 'Streams/text',
		'title' => 'Untitled',
		'icon' => 'default',
		'content' => '',
		'attributes' => '',
		'readLevel' => 40,
		'writeLevel' => 10,
		'adminLevel' => 20,
		'messageCount' => 0,
		'participantCount' => 0
	);
	
	/**
	 * Whether stream was published by fetcher
	 * @property $publishedByFetcher
	 * @type {boolean}
	 * @protected
	 */
	protected $publishedByFetcher = false;

	private static function sortTemplateTypes($templates, $user_field, &$type, $name_field = 'streamName') {
		$returnAll = ($type === true);
		$ret = array(array(), array(), array(), array());
		if (!$templates) {
			$type = -1;
			return $returnAll ? $ret : null;
		}
		// The order of the templates will be from most specific to most generic:
		// 	0. exact stream name and exact publisher id - this would be the row itself
		//	1. generic stream name and exact publisher id
		//	2. exact stream name and generic publisher
		//	3. generic stream name and generic publisher
		foreach ($templates as $t) {
			$pos = strlen($t->$name_field) - 1;
			$name = $t->$name_field;
			if ($t->$user_field === '') {
				$key = ($name[$pos] === '/' ? 3 : 2); // generic publisher;
			} else {
				$key = ($name[$pos] === '/' ? 1 : 0); // $userId
			}
			$ret[$key][] = $t;
		}

		if ($returnAll) {
			// we are looking for all templates
			return $ret;
		}
		// we are looking for exactly one template
		for ($i=0; $i < 4; $i++) {
			if (!empty($ret[$i][0])) {
				$type = $i;
				return $ret[$i][0];
			}
		}
		if (!$templates) {
			$type = -1;
			return $returnAll ? $ret : null;
		}
	}

	protected function getStreamTemplate($class_name, &$type = null) {
		// fetch template for stream's PK - publisher & name
		// if $type == true return all found templates sorted by type,
		// otherwise return one template and its type
		$field = ($class_name === 'Streams_Stream' ? 'name' : 'streamName');
		$rows = call_user_func(array($class_name, 'select'), '*')
			->where(array(
				'publisherId' => array('', $this->publisherId), // generic or specific publisher
				$field => $this->type.'/'
			))->fetchDbRows();
		return self::sortTemplateTypes($rows, 'publisherId', $type, $field);
	}
	
	protected function getSubscriptionTemplate($class_name, $userId, &$type = null) {
		// fetch template for subscription's PK - publisher, name & user
		$rows = call_user_func(array($class_name, 'select'), '*')
			->where(array(
				'publisherId' => $this->publisherId,
				'streamName' => $this->type.'/', // generic or specific stream name
				'ofUserId' => array('', $userId) // generic or specific subscriber user
			))->fetchDbRows();
		return self::sortTemplateTypes($rows , 'ofUserId', $type, 'streamName');
	}

	/**
	 * Make necessary preparations to create new stream.
	 * <ol>
	 * 	<li>assign unique for publisher stream name if not set before</li>
	 * 	<li>make sure that user is not setting 'private' fields. These fields are defined by config value
	 *		at 'Streams/types/THE_TYPE/private'</li>
	 * 	<li>check if stream template exists and fill all fields not set by user to that template fields.
	 * 		Also 'private' fields are reset to those from template</li>
	 * 	<li>if stream template does not exist simply reset all 'private' fields to their config defaults
	 *		defined at 'Streams/types/THE_TYPE/default' or Streams_Stream::$DEFAULTS</li>
	 * 	<li>look up acess template for this stream and copy it with stream's publisher and name
	 *		to relate to this particular stream</li>
	 * </ol>
	 * <b>NOTE:</b> Stream template shall contain publisherId as generic - 0 or exact publisher Id and
	 *		name as generic - THE_TYPE/ or exact stream name. Access template is defined the same way and shall
	 *		contain additionally exact user Id or label. All access templates are processed, more specific have priority:
	 * <ol>
	 *	<li>exact stream name and exact publisher id - this is record for existing row</li>
	 *	<li>generic stream name and exact publisher id</li>
	 *	<li>exact stream name and generic publisher</li>
	 *	<li>generic stream name and generic publisher</li>
	 * </ol>
	 * @method beforeSave
	 * @param {array} $modifiedFields
	 *	The array of fields
	 * @return {array}
	 * @throws {Exception}
	 *	If mandatory field is not set
	 */
	function beforeSave($modifiedFields)
	{
		if (empty($this->attributes)) {
			$this->attributes = '{}';
		}
		
		if (!$this->retrieved) {
			// Generate a unique name for the stream
			if (!isset($modifiedFields['name'])) {
				$this->name = $modifiedFields['name'] = Streams::db()->uniqueId(Streams_Stream::table(), 'name',
					array('publisherId' => $this->publisherId),
					array('prefix' => $this->type.'/Q')
				);
			}
			// we don't want user to update private fields but will set initial values to them
			$privateFieldNames = array_merge(
				Q_Config::get('Streams', 'types', $this->type, 'private', array()),
				Q_Config::expect('Streams', 'defaults', 'private')
			);
			// magic fields are handled by parent method
			$magicFieldNames = array('insertedTime', 'updatedTime');
			$privateFieldNames = array_diff($privateFieldNames, $magicFieldNames);

			$streamTemplate = $this->getStreamTemplate('Streams_Stream');
			$fieldNames = Streams_Stream::fieldNames();

			if ($streamTemplate) {
				// if template exists copy all non-PK and non-magic fields from template
				foreach (array_diff(
					$fieldNames,
					$this->getPrimaryKey(),
					$magicFieldNames
				) as $field) {
					if (in_array($field, $privateFieldNames)
					|| !array_key_exists($field, $modifiedFields)) {
						$this->$field = $modifiedFields[$field] = $streamTemplate->$field;
					}
				}
			} else {
				// otherwise (no template) set all private fields to defaults
				foreach ($privateFieldNames as $field) {
					$this->$field = $modifiedFields[$field] = Q_Config::get(
						'Streams', 'types', $this->type, 'defaults', $field,
						isset(Streams_Stream::$DEFAULTS[$field]) 
							? Streams_Stream::$DEFAULTS[$field] 
							: null
					);
				}
			}

			// Assign default values to fields that haven't been set yet
			foreach (array_diff($fieldNames, $magicFieldNames) as $field) {
				if (!array_key_exists($field, $this->fields)
				and !array_key_exists($field, $modifiedFields)) {
					$this->$field = $modifiedFields[$field] = Q_Config::get(
						'Streams', 'types', $this->type, 'defaults', $field,
						isset(Streams_Stream::$DEFAULTS[$field])
							? Streams_Stream::$DEFAULTS[$field] 
							: null
					);
				}
			}

			// Get all access templates and save corresponding access
			$type = true;
			$accessTemplates = $this->getStreamTemplate('Streams_Access', $type);
			for ($i=1; $i<=3; ++$i) {
				foreach ($accessTemplates[$i] as $template) {
					$access = new Streams_Access();
					$access->copyFrom($template->toArray());
					$access->publisherId = $this->publisherId;
					$access->streamName = $this->name;
					if (!$access->save(true)) {
						return false; // JUNK: this leaves junk in the database, but preserves consistency
					}
				}
			}
		}

		/**
		 * @event Streams/Stream/save/$streamType {before}
		 * @param {Streams_Stream} 'stream'
		 * @return {false} To cancel further processing
		 */
		$params = array('stream' => $this, 'modifiedFields' => $modifiedFields);
		if (false === Q::event(
			"Streams/Stream/save/{$this->type}", $params, 'before'
		)) {
			return false;
		}

		foreach ($this->fields as $name => $value) {
			if (!empty($this->fieldsModified[$name])) {
				$modifiedFields[$name] = $value;
			}
		}
		$this->beforeSaveExtended($modifiedFields);

		return parent::beforeSave($modifiedFields);
	}

	function afterFetch($result)
	{		
		/**
		 * @event Streams/Stream/retrieve/$streamType {before}
		 * @param {Streams_Stream} 'stream'
		 * @return {false} To cancel further processing
		 */
		$params = array('stream' => $this, 'result' => $result);
		if (false === Q::event(
			"Streams/Stream/fetch/{$this->type}", $params, 'after'
		)) {
			return false;
		}
	}
	
	/**
	 * @method afterSaveExcecute
	 * @param {Db_Result} $result
	 * @param {Db_Query} $query
	 * @return {Db_Result}
	 */
	function afterSaveExecute($result, $query, $modifiedFields, $where)
	{
		$stream = $this;
		
		$asUserId = $stream->get('asUserId', null);
		if (!$asUserId) {
			$user = Users::loggedInUser(false, false);
			$asUserId = $user ? $user->id : '';
		}
		
		if (!$stream->retrieved) {
			// The stream was just saved
			Q_Utils::sendToNode(array(
				"Q/method" => "Streams/Stream/create",
				"stream" => Q::json_encode($stream->toArray())
			));

			/**
			 * @event Streams/create/$streamType {after}
			 * @param {Streams_Stream} 'stream'
			 * @param {string} 'asUserId'
			 */
			Q::event("Streams/create/{$stream->type}",
				compact('stream', 'asUserId'), 'after', false, $stream);
		}

		/**
		 * @event Streams/Stream/save/$streamType {after}
		 * @param {Streams_Stream} 'stream'
		 * @param {string} 'asUserId'
		 */
		$params = array('stream' => $this);
		Q::event("Streams/Stream/save/{$this->type}", $params, 'after');

		// Assume that the stream's name is not being changed
		$fields = array(
			'Streams/user/firstName' => false,
			'Streams/user/lastName' => false,
			'Streams/user/username' => 'username',
			'Streams/user/icon' => 'icon'
		);
		if (!isset($fields[$this->name])) {
			return $result;
		}
		$field = ($this->name === 'Streams/user/icon')
			? 'icon'
			: 'content';
		if (empty($this->fieldsModified[$field])
		and empty($this->fieldsModified['readLevel'])) {
			return $result;
		}
		
		if ($publicField = $fields[$this->name]
		and !Q::eventStack('Db/Row/Users_User/saveExecute')) {
			$user = Users_User::fetch($this->publisherId, true);
			$user->$publicField = $modifiedFields[$field];
			$user->save();
		}

		if ($this->retrieved and !$publicField) {
			// Update all avatars corresponding to access rows for this stream
			$taintedAccess = Streams_Access::select('*')
				->where(array(
					'publisherId' => $this->publisherId,
					'streamName' => $this->name
				))->fetchDbRows();
			Streams::updateAvatars($this->publisherId, $taintedAccess, $this, true);
		}
		
		return $result;
	}
	
	function beforeRemove($pk)
	{
		/**
		 * @event Streams/remove/$streamType {before}
		 * @param {Streams_Stream} 'stream'
		 * @param {string} 'asUserId'
		 * @return {false} To cancel further processing
		 */
		if (Q::event("Streams/remove/{$this->type}", compact('stream'), 'before') === false) {
			return false;
		}
		return true;
	}
	
	/**
	 * @method afterRemoveExcecute
	 * @param {Db_Result} $result
	 * @param {Db_Query} $query
	 * @return {Db_Result}
	 */
	function afterRemoveExecute($result, $query)
	{
		$stream = $this;

		// if the above call threw an exception, then we will not be doing the following.
		Q_Utils::sendToNode(array(
			"Q/method" => "Streams/Stream/remove",
			"stream" => Q::json_encode($stream->toArray())
		));

		/**
		 * @event Streams/remove/$streamType {after}
		 * @param {Streams_Stream} 'stream'
		 * @param {string} 'asUserId'
		 */
		Q::event("Streams/remove/{$stream->type}", compact('stream', 'result'), 'after');

		if ($this->name !== 'Streams/user/firstName'
		and $this->name !== 'Streams/user/lastName') {
			return $result;
		}
		
		// Update all avatars corresponding to access rows for this stream
		$taintedAccess = Streams_Access::select('*')
			->where(array(
				'publisherId' => $this->publisherId,
				'streamName' => $this->name
			))->fetchDbRows();
		Streams::updateAvatars($this->publisherId, $taintedAccess, $this, true);

		return $result;
	}
	
	protected function beforeSaveExtended($modifiedFields)
	{
		$type = $this->type;
		$classes = Streams::getExtendClasses($type);
		$modified = array();
		foreach ($classes as $k => $v) {
			foreach ($v as $f) {
				if ($this->fieldsModified[$f]) {
					$modified[$k] = true;
					break;
				}
			}
		}
		$retrieved = $this->wasRetrieved();
		$rows = array();
		foreach ($modified as $k => $v) {
			$row = new $k;
			$row->publisherId = $this->publisherId;
			$row->streamName = $this->name;
			if ($retrieved) {
				$row->retrieve(null, null, array('ignoreCache' => true));
			}
			foreach ($classes[$k] as $f) {
				if (!isset($modifiedFields[$f])) continue;
				if (isset($row->$f) and $row->$f === $modifiedFields[$f]) continue;
				$row->$f = $modifiedFields[$f];
			}
			$rows[$k] = $row;
		}
		$stream = $this;
		Q::event("$type/save", compact('stream', 'rows'), 'before');
		foreach ($rows as $row) {
			$row->save();
		}
	}

	protected function getUserStream ($options, &$userId, &$user = null) {
		if (isset($options['userId'])) {
			$user = Users_User::fetch($options['userId']);
			if (!$user) {
				throw new Q_Exception_MissingRow(array(
					'table' => 'user',
					'criteria' => "id = ".$options['userId']
				));
			}
		} else {
			$user = Users::loggedInUser(true);
		}
		$userId = $user->id;
		if ($userId === $this->get('asUserId', null)) {
			return $this;
		} else {
			$stream = Streams::fetchOne($userId, 
				$this->publisherId, $this->name, '*', 
				array('refetch' => true)
			);
			if (!$stream) { // this should never happen
				throw new Q_Exception("Error getting {$this->name} stream published by {$this->publisherId} for user '$userId'");
			}
			return $stream;
		}
	}
	
	/**
	 * @method getAllAttributes
	 * @return {array} The array of all attributes set in the stream
	 */
	function getAllAttributes()
	{
		return empty($this->attributes) 
			? array()
			: json_decode($this->attributes, true);
	}
	
	/**
	 * @method getAttribute
	 * @param {string} $attributeName The name of the attribute to get
	 * @param {mixed} $default The value to return if the attribute is missing
	 * @return {mixed} The value of the attribute, or the default value, or null
	 */
	function getAttribute($attributeName, $default = null)
	{
		$attr = $this->getAllAttributes();
		return isset($attr[$attributeName]) ? $attr[$attributeName] : $default;
	}
	
	/**
	 * @method setAttribute
	 * @param {string} $attributeName The name of the attribute to set,
	 *  or an array of $attributeName => $attributeValue pairs
	 * @param {mixed} $value The value to set the attribute to
	 */
	function setAttribute($attributeName, $value = null)
	{
		$attr = $this->getAllAttributes();
		if (is_array($attributeName)) {
			foreach ($attributeName as $k => $v) {
				$attr[$k] = $v;
			}
		} else {
			$attr[$attributeName] = $value;
		}
		$this->attributes = Q::json_encode($attr);
	}
	
	/**
	 * @method clearAttribute
	 * @param {string} $attributeName The name of the attribute to remove
	 */
	function clearAttribute($attributeName)
	{
		$attr = $this->getAllAttributes();
		unset($attr[$attributeName]);
		$this->attributes = Q::json_encode($attr);
	}
	
	/**
	 * @method clearAllAttributes
	 */
	function clearAllAttributes()
	{
		$this->attributes = '{}';
	}
	
	/**
	 * If the user is not participating in the stream yet, 
	 * inserts a participant record and posts a "Streams/join" type message to the stream.
	 * Otherwise update timestamp
	 * @method join
	 * @param $options=array() {array}
	 *  An associative array of options. The keys can be:<br/>
	 *  "subscribed" => boolean<br/>
	 *  "posted" => boolean<br/>
	 *  "extra" => array<br/>
	 *  "userId" => The user who is joining the stream. Defaults to the logged-in user.
	 *  "noVisit" => If user is already participating, don't post a "Streams/visited" message
	 *  "skipAccess": if true, skip access check for whether user can join
	 * @param $participant=null {reference}
	 *  Optional reference to a participant object that will be filled
	 *  to point to the participant object, if any.
	 * @return {Streams_Participant|false}
	 */
	function join($options = array(), &$participant = null)
	{
		$stream = $this->getUserStream($options, $userId);

		if (empty($options['skipAccess'])
		and !$stream->testWriteLevel('join')) {
			if (!$stream->testReadLevel('see')) {
				throw new Streams_Exception_NoSuchStream();
			}
			throw new Users_Exception_NotAuthorized();
		}

		// Add to participant list
		$participant = new Streams_Participant();
		$participant->publisherId = $stream->publisherId;
		$participant->streamName = $stream->name;
		$participant->userId = $userId;

		if($participant->retrieve(null, null, array('ignoreCache' => true))) {
			if (isset($options['subscribed'])) {
				$subscribed = empty($options['subscribed']) ? 'no' : 'yes';
				$participant->subscribed = $subscribed;
			}
			$type = ($participant->state === 'participating') ? 'visit' : 'join';
			$participant->state = 'participating';
			if (!$participant->save()) {
				return false;
			}
			if (empty($options['noVisit']) or $type !== 'visit') {
				// Send a message to Node
				Q_Utils::sendToNode(array(
					"Q/method" => "Streams/Stream/$type",
					"participant" => Q::json_encode($participant->toArray()),
					"stream" => Q::json_encode($stream->toArray())
				));
				// Post a message
				$stream->post($userId, array(
					'type' => "Streams/$type",
					'instructions' => Q::json_encode(array(
						'extra' => isset($participant->extra) ? $participant->extra : array()
					))
				), true);
				// Now post Streams/joined message to Streams/participating
				Streams_Message::post($userId, $userId, 'Streams/participating', array(
					'type' => "Streams/{$type}ed",
					'instructions' => Q::json_encode(array(
						'publisherId' => $stream->publisherId,
						'streamName' => $stream->name
					))
				), true);
			}
		} else {
			$participant->streamType = $stream->type;
			$participant->subscribed = !empty($options['subscribed']) ? 'yes' : 'no';
			$participant->posted = !empty($options['posted']) ? 'yes' : 'no';
			$participant->reputation = !empty($options['reputation']) ? $options['reputation'] : 0;
			$participant->state = 'participating';
			$participant->extra = !empty($options['extra']) ? $options['extra'] : '';

			if (!$participant->save(true)) {
				return false;
			}
			// Send a message to Node
			Q_Utils::sendToNode(array(
				"Q/method" => "Streams/Stream/join", 
				"participant" => Q::json_encode($participant->toArray()),
				"stream" => Q::json_encode($stream->toArray())
			));

			// Post Streams/join message to the stream
			$stream->post($userId, array(
				'type' => 'Streams/join',
				'instructions' => Q::json_encode(array(
					'extra' => isset($participant->extra) ? $participant->extra : array()
				))
			), true);

			// Now post Streams/joined message to Streams/participating
			Streams_Message::post($userId, $userId, 'Streams/participating', array(
				'type' => "Streams/joined",
				'instructions' => Q::json_encode(array(
					'publisherId' => $stream->publisherId,
					'streamName' => $stream->name
				))
			), true);	
		}
		return $participant;
	} 
	
	/**
	 * If the user is participating in the stream, sets state of participant row
	 * as "left" and posts a "Streams/leave" type message to the stream
	 * @method leave
	 * @param $options=array() {array}
	 *  An associative array of options. The keys can be:<br/>
	 *  "userId": The user who is leaving the stream. Defaults to the logged-in user.
	 *  "skipAccess": if true, skip access check for whether user can join
	 * @param $participant=null {reference}
	 *  Optional reference to a participant object that will be filled
	 *  to point to the participant object, if any.
	 * @return {boolean}
	 */
	function leave($options = array(), &$participant = null)
	{
		$stream = $this->getUserStream($options, $userId);
		
		if (empty($options['skipAccess'])
		and !$stream->testWriteLevel('join')) {
			if (!$stream->testReadLevel('see')) {
				throw new Streams_Exception_NoSuchStream();
			}
			throw new Users_Exception_NotAuthorized();
		}
		
		$participant = new Streams_Participant();
		$participant->publisherId = $stream->publisherId;
		$participant->streamName = $stream->name;
		$participant->userId = $userId;

		if(!$participant->retrieve()) {
			throw new Q_Exception_MissingRow(array(
				'table' => 'participant', 
				'criteria' => "userId = $userId, publisherId = {$stream->publisherId}, name = {$stream->name}"
			));
		}

		// Remove from participant list
		if ($participant->state === 'left') {
			return false;
		}
		$participant->state = 'left';
		if (!$participant->save()) {
			return false;
		}
		Q_Utils::sendToNode(array(
			"Q/method" => "Streams/Stream/leave",
			"participant" => Q::json_encode($participant->toArray()),
			"stream" => Q::json_encode($stream->toArray())
		));
		
		// Post Streams/leave message to the stream
		$stream->post($userId, array('type' => 'Streams/leave'), true);
		
		// Now post Streams/left message to Streams/participating
		Streams_Message::post($userId, $userId, 'Streams/participating', array(
			'type' => 'Streams/left',
			'content' => '',
			'instructions' => Q::json_encode(array(
				'publisherId' => $stream->publisherId,
				'streamName' => $stream->name
			))
		), true);
		return true;
	}

	/**
	 * Subscribe to the stream's messages<br/>
	 *	If options are not given check the subscription templates:
	 *	<ol>
	 *		<li>1. exact stream name and exact user id</li>
	 *		<li>2. generic stream name and exact user id</li>
	 *		<li>3. exact stream name and generic user</li>
	 *		<li>4. generic stream name and generic user</li>
	 *	</ol>
	 *	default is to subscribe to ALL messages.<br/>
	 *	If options supplied - skip templates and use options<br/><br/>
	 * Using subscribe if subscription is already active will modify existing
	 * subscription - change type(s) or modify notifications
	 * @method subscribe
	 * @param $options=array() {array}
	 *	"types": array of message types, if this is empty then subscribes to all types
	 *	"notifications": number of notifications, default - 0 meaning all
	 *	"untilTime": time limit for subscription, default - null meaning forever
	 *	"readyTime": time from which user is ready to receive notifications again
	 *  "userId": the user subscribing to the stream. Defaults to the logged in user.
	 *  "skipRules": if true, do not attempt to create rules
	 *  "skipAccess": if true, skip access check for whether user can subscribe
	 * @return {Streams_Subscription|false}
	 */
	function subscribe($options = array())
	{
		$stream = $this->getUserStream($options, $userId, $user);
		
		if (empty($options['skipAccess'])
		and !$stream->testReadLevel('messages')) {
			if (!$stream->testReadLevel('see')) {
				throw new Streams_Exception_NoSuchStream();
			}
			throw new Users_Exception_NotAuthorized();
		}
		
		// first make user a participant
		$stream->join(array(
			"userId" => $userId,
			"subscribed" => true,
			"noVisit" => true,
			"skipAccess" => Q::ifset($options, 'skipAccess', false)
		));

		// check for 'messages' level

		$s = new Streams_Subscription();
		$s->publisherId = $stream->publisherId;
		$s->streamName = $stream->name;
		$s->ofUserId = $userId;
		$s->retrieve();

		$type = null;
		if ($template = $stream->getSubscriptionTemplate('Streams_Subscription', $userId, $type)) {
			$filter = json_decode($template->filter, true);
		} else {
			$filter = array(
				'types' => array(),
				'notifications' => 0
			);
		}
		if (isset($options['types'])) {
			$filter['types'] = !empty($options['types']) ? $options['types'] : $filter['types'];
		}
		if (isset($options['notifications'])) {
			$filter['notifications'] =  $options['notifications'];
		}

		$s->filter = Q::json_encode($filter);

		if (isset($options['untilTime'])) {
			$s->untilTime = $options['untilTime'];
		} else if ($type > 0 and $template and $template->duration > 0) {
			$s->untilTime = date("c", time() + $template->duration);
		}
		if (!$s->save(true)) {
			return false;
		}

		if (empty($options['skipRules'])) {
			// Now let's handle rules
			$type2 = null;
			$template = $stream->getSubscriptionTemplate('Streams_Rule', $userId, $type2);

			$ruleSuccess = true;
			if ($type2 !== 0) {
				$rule = new Streams_Rule();
				$rule->ofUserId = $userId;
				$rule->publisherId = $stream->publisherId;
				$rule->streamName = $stream->name;
				if (empty($template) and $rule->retrieve()) {
					$ruleSuccess = false;
				} else {
					$rule->readyTime = isset($options['readyTime']) ? $options['readyTime'] : new Db_Expression('CURRENT_TIMESTAMP');
					$rule->filter = !empty($template->filter) ? $template->filter : '{"types":[],"labels":[]}';
					$rule->relevance = !empty($template->relevance) ? $template->relevance : 1;
			
					if (!empty($template->deliver)) {
						$rule->deliver = $template->deliver;
					} else {
						if (isset($user->mobileNumber)) {
							$deliver = array('mobile' => $user->mobileNumber);
						} else if (isset($user->emailAddress)) {
							$deliver = array('email' => $user->emailAddress);
						} else if (isset($user->mobileNumberPending)) {
							$deliver = array('mobile' => $user->mobileNumberPending);
						} else if (isset($user->emailAddressPending)) {
							$deliver = array('email' => $user->emailAddressPending);
						} else {
							$deliver = array();
							$ruleSuccess = false;
						}
						$rule->deliver = Q::json_encode($deliver);
					}
					$ruleSuccess = !empty($deliver) and !!$rule->save();
				}
			}
		}

		// skip error testing for rule save BUT inform node. Node can notify user to check the rules
		Q_Utils::sendToNode(array(
			"Q/method" => "Streams/Stream/subscribe",
			"subscription" => Q::json_encode($s->toArray()),
			"stream" => Q::json_encode($stream->toArray()),
			"success" => Q::json_encode($ruleSuccess)
		));
		
		// Post Streams/subscribe message to the stream
		$stream->post($userId, array('type' => 'Streams/subscribe'), true);
		
		// Now post Streams/subscribed message to Streams/participating
		Streams_Message::post($userId, $userId, 'Streams/participating', array(
			'type' => 'Streams/subscribed',
			'instructions' => Q::json_encode(array(
				'publisherId' => $stream->publisherId,
				'streamName' => $stream->name
			))
		), true);

		return $s;
	}

	/**
	 * Unsubcsribe from all or specific stream's messages
	 * @method unsubscribe
	 * @param $options=array() {array}
	 *  "userId": The user who is unsubscribing from the stream. Defaults to the logged-in user.
	 *  "skipAccess": if true, skip access check for whether user can unsubscribe
	 * @return {boolean}
	 */
	function unsubscribe($options = array()) {

		$stream = $this->getUserStream($options, $userId);
		
		if (empty($options['skipAccess'])
		and !$stream->testReadLevel('messages')) {
			if (!$stream->testReadLevel('see')) {
				throw new Streams_Exception_NoSuchStream();
			}
			throw new Users_Exception_NotAuthorized();
		}
		
		$participant = $stream->join(array(
			"userId" => $userId,
			'subscribed' => false,
			'noVisit' => true,
			"skipAccess" => Q::ifset($options, 'skipAccess', false)
		));

		Q_Utils::sendToNode(array(
			"Q/method" => "Streams/Stream/unsubscribe",
			"stream" => Q::json_encode($stream->toArray()),
			"participant" => Q::json_encode($participant),
			"success" => Q::json_encode(!!$participant)
		));
		
		// Post Streams/unsubscribe message to the stream
		$stream->post($userId, array('type' => 'Streams/unsubscribe'), true);
		
		// Now post Streams/unsubscribed message to Streams/participating
		Streams_Message::post($userId, $userId, 'Streams/participating', array(
			'type' => 'Streams/unsubscribed',
			'instructions' => Q::json_encode(array(
				'publisherId' => $stream->publisherId,
				'streamName' => $stream->name
			))
		), true);

		return !!$participant;
	}
	
	/**
	 * If the user is subscribed, get the Streams_Subscription object.
	 * Otherwise, returns false, or null if the user isn't logged in.
	 * @param {string} $ofUserId Defaults to logged-in user's id, if any.
	 * @return {Streams_Subscription|false|null}
	 */
	function subscription($ofUserId = null)
	{
		if (!isset($ofUserId)) {
			$user = Users::loggedInUser();
			if (!$user) {
				return null;
			}
			$ofUserId = $user->id;
		}
		$s = new Streams_Subscription();
		$s->publisherId = $this->publisherId;
		$s->streamName = $this->name;
		$s->ofUserId = $ofUserId;
		return $s->retrieve();
	}
	
	/**
	 * If the user is participating, get the Streams_Participant object.
	 * Otherwise, returns false, or null if the user isn't logged in.
	 * @param {string} $userId Defaults to logged-in user's id, if any.
	 * @return {Streams_Subscription|false|null}
	 */
	function participant($userId = null)
	{
		if (!isset($userId)) {
			$user = Users::loggedInUser();
			if (!$user) {
				return null;
			}
			$userId = $user->id;
		}
		$p = new Streams_Participant();
		$p->publisherId = $this->publisherId;
		$p->streamName = $this->name;
		$p->userId = $userId;
		return $p->retrieve();
	}

	/**
	 * Post a message to stream
	 * @method post
	 * @param {string} $asUserId
	 *  The user to post as
	 * @param {array} $information
	 *  The fields of the message. Also may include 'streamNames' field which is an array of additional
	 *  names of the streams to post message to.
	 * @param {booleam} $skipAccess=false
	 *  If true, skips the access checks and just posts the message.
	 * @param $options=array() {array}
	 * @return {array}
	 *  The array of results - successfully posted messages or false if post failed
	 */
	function post(
		$asUserId,
		$information,
		$skipAccess=false)
	{
		return Streams_Message::post(
			$asUserId,
			$this->publisherId,
			$this->name,
			$information,
			$skipAccess,
			array($this)
		);
	}
	
	/**
	 * Invites a user (or a future user) to a stream .
	 * @method invite
	 * @static
	 * @param {string} $publisherId
	 *  The id of the stream publisher
	 * @param {string} $streamName
	 *  The name of the stream the user will be invited to
	 * @param {array} $who
	 *  Array that can contain the following keys:
	 *  'userId' => user id or an array of user ids
	 *  'fb_uid' => fb user id or array of fb user ids
	 *  'label' => label or an array of labels, or tab-delimited string
	 *  'identifier' => identifier or an array of identifiers, or tab-delimited string
	 * @param {mixed} $options
	 *  Array that can contain the following keys:
	 *	'label' => the contact label to add to the invited users
	 *  'readLevel' => the read level to grant those who are invited
	 *  'writeLevel' => the write level to grant those who are invited
	 *  'adminLevel' => the admin level to grant those who are invited
	 *	'displayName' => the name of inviting user
	 *  'appUrl' => Can be used to override the URL to which the invited user will be redirected and receive "Q.Streams.token" in the querystring.
	 * @see Users::addLink()
	 * @return {array} returns array("success", "invited", "alreadyParticipating")
	 */
	static function invite($publisherId, $streamName, $who, $options = array())
	{
		$user = Users::loggedInUser(true);

		// Fetch the stream as the logged-in user
		$stream = Streams::fetch($user->id, $publisherId, $streamName);
		if (!$stream) {
			throw new Q_Exception_MissingRow(array(
				'table' => 'stream',
				'criteria' => 'with that name'
			), 'streamName');		
		}
		$stream = reset($stream);

		// Do we have enough admin rights to invite others to this stream?
		if (!$stream->testAdminLevel('invite') || !$stream->testWriteLevel('join')) {
			throw new Users_Exception_NotAuthorized();
		}

		// get user ids if any to array, throw if user not found
		$raw_userIds = isset($who['userId']) 
			? Users_User::verifyUserIds($who['userId'], true)
			: array();
		// merge labels if any
		if (isset($who['labels'])) {
			$labels = $who['labels'];
			if (is_string($labels)) {
				$labels = array_map('trim', explode("\t", $labels)) ;
			}
			$raw_userIds = array_merge(
				$raw_userIds, 
				Users_User::labelsToIds($user->id, $labels)
			);
		}
		// merge identifiers if any
		$identifierType = null;
		if (isset($who['identifier'])) {
			$identifier = $who['identifier'];
			if (is_string($identifier)) {
				if (Q_Valid::email($who['identifier'])) {
					$identifierType = 'email';
				} else if (Q_Valid::phone($who['identifier'])) {
					$identifierType = 'mobile';
				}
				$identifier = array_map('trim', explode("\t", $identifier)) ;
			}
			$statuses = array();
			$identifier_ids = Users_User::idsFromIdentifiers($who['identifier'], $statuses);
			$raw_userIds = array_merge($raw_userIds, $identifier_ids);
		}
		// merge fb uids if any
		if (isset($who['fb_uid'])) {
			$fb_uids = $who['fb_uid'];
			if (is_string($fb_uids)) {
				$fb_uids = array_map('trim', explode("\t", $fb_uids)) ;
			}
			$raw_userIds = array_merge(
				$raw_userIds, 
				Users_User::idsFromFacebook($fb_uids)
			);
		}
		// ensure that each userId is included only once
		// and remove already participating users
		$raw_userIds = array_unique($raw_userIds);
		$total = count($raw_userIds);

		$userIds = Streams_Participant::filter($raw_userIds, $stream);
		$to_invite = count($userIds);

		$appUrl = !empty($options['appUrl'])
			? $options['appUrl']
			: Q_Request::baseUrl().'/'.Q_Config::get(
				"Streams", "types", $stream->type, 
				"invite", "url", "plugins/Streams/stream"
			);

		// now check and define levels for invited user
		$readLevel = isset($options['readLevel']) ? $options['readLevel'] : null;
		if (isset($readLevel)) {
			if (!$stream->testReadLevel($readLevel)) {
				// We can't assign greater read level to other people than we have ourselves!
				throw new Users_Exception_NotAuthorized();
			}
		}
		$writeLevel = isset($options['writeLevel']) ? $options['writeLevel'] : null;
		if (isset($writeLevel)) {
			if (!$stream->testWriteLevel($writeLevel)) {
				// We can't assign greater write level to other people than we have ourselves!
				throw new Users_Exception_NotAuthorized();
			}
		}
		$adminLevel = isset($options['adminLevel']) ? $options['adminLevel'] : null;
		if (isset($adminLevel)) {
			if (!$stream->testAdminLevel($adminLevel+1)) {
				// We can't assign an admin level greater, or equal, to our own!
				// A stream's publisher can assign owners. Owners can assign admins.
				// Admins can confer powers to invite others, to some people.
				// Those people can confer the privilege to publish a message re this stream.
				// But admins can't assign other admins, and even stream owners
				// can't assign other owners. 
				throw new Users_Exception_NotAuthorized();
			}
		}

		// calculate expiry time
		$duration = Q_Config::get("Streams", "types", $stream->type, "invite", "duration", false);
		$expiry = $duration ? strtotime($duration) : null;

		// let node handle the rest, and get the result
		$result = Q_Utils::queryInternal('Q/node', array(
			"Q/method" => "Streams/Stream/invite",
			"invitingUserId" => $user->id,
			"username" => $user->username,
			"userIds" => Q::json_encode($userIds),
			"stream" => Q::json_encode($stream->toArray()),
			"appUrl" => $appUrl,
			"label" => isset($options['label']) ? $options['label'] : null, 
			"readLevel" => $readLevel,
			"writeLevel" => $writeLevel,
			"adminLevel" => $adminLevel,
			"displayName" => isset($options['displayName'])
				? $options['displayName']
				: Streams::displayName($user),
			"expiry" => $expiry
		));

		return array(
			'success' => $result,
			'invited' => $userIds,
			'statuses' => $statuses,
			'identifierType' => $identifierType,
			'alreadyParticipating' => $total - $to_invite
		);
	}
	
	/**
	 * Checks or sets wheather stream was published by fetcher
	 * @method publishedByFetcher
	 * @param {boolean} $new_value=null
	 *	Optional. The value to set
	 * @return {boolean}
	 */
	function publishedByFetcher($new_value = null)
	{
		if (isset($new_value)) {
			$this->publishedByFetcher = true;
		}
		return $this->publishedByFetcher;
	}
	
	/**
	 * Verifies whether the user has at least a certain read level for the Stream
	 * @method testReadLevel
	 * @param {string|integer} $level
	 *	String describing the level (see Streams::$READ_LEVEL) or integer
	 * @return {boolean}
	 * @throws {Q_Exception_WrongValue}
	 *	If string is not referring to Streams::$READ_LEVEL
	 */
	function testReadLevel($level)
	{
		if ($this->publishedByFetcher) {
			return true;
		}
		if (!empty($this->closedTime) and !$this->testWriteLevel('close')) {
			return false;
		}
		if (!is_numeric($level)) {
			$level = isset(Streams::$READ_LEVEL[$level])
				? Streams::$READ_LEVEL[$level]
				: null;
			if (!isset($level)) {
				throw new Q_Exception_WrongValue(
					array(
						'field' => 'level', 
						'range' => 'one of: ' . implode(', ', array_keys(Streams::$READ_LEVEL))
					)
				);
			}
		}
		$readLevel = $this->get('readLevel', 0);
		if ($readLevel >= 0 and $readLevel >= $level) {
			return true;
		}
		$readLevel_source = $this->get('readLevel_source', 0);
		if ($readLevel_source === Streams::$ACCESS_SOURCES['direct']
		or $readLevel_source === Streams::$ACCESS_SOURCES['inherited_direct']) {
			return false;
		}
		if (!$this->inheritAccess()) {
			return false;
		}
		$readLevel = $this->get('readLevel', 0);
		if ($readLevel >= 0 and $readLevel >= $level) {
			return true;
		}
		return false;
	}
	
	/**
	 * Verifies whether the user has at least a certain write level for the Stream
	 * @method testWriteLevel
	 * @param {string|integer} $level
	 *	String describing the level (see Streams::$WRITE_LEVEL) or integer
	 * @return {boolean}
	 * @throws {Q_Exception_WrongValue}
	 *	If string is not referring to Streams::$WRITE_LEVEL
	 */
	function testWriteLevel($level)
	{
		if ($this->publishedByFetcher) {
			return true;
		}
		if (!empty($this->closedTime) and $level !== 'close' and !$this->testWriteLevel('close')) {
			return false;
		}
		if (!is_numeric($level)) {
			$level = isset(Streams::$WRITE_LEVEL[$level])
				? Streams::$WRITE_LEVEL[$level]
				: null;
			if (!isset($level)) {
				throw new Q_Exception_WrongValue(
					array(
						'field' => 'level', 
						'range' => 'one of: ' . implode(', ', array_keys(Streams::$WRITE_LEVEL))
					)
				);
			}
		}
		$writeLevel = $this->get('writeLevel', 0);
		if ($writeLevel >= 0 and $writeLevel >= $level) {
			return true;
		}
		$writeLevel_source = $this->get('writeLevel_source', 0);
		if ($writeLevel_source === Streams::$ACCESS_SOURCES['direct']
		or $writeLevel_source === Streams::$ACCESS_SOURCES['inherited_direct']) {
			return false;
		}
		if (!$this->inheritAccess()) {
			return false;
		}
		$writeLevel = $this->get('writeLevel', 0);
		if ($writeLevel >= 0 and $writeLevel >= $level) {
			return true;
		}
		return false;
	}
	
	/**
	 * Verifies whether the user has at least a certain admin level in the Stream
	 * @method testAdminLevel
	 * @param {string|integer} $level
	 *	String describing the level (see Streams::$ADMIN_LEVEL) or integer
	 * @return {boolean}
	 * @throws {Q_Exception_WrongValue}
	 *	If string is not referring to Streams::$ADMIN_LEVEL
	 */
	function testAdminLevel($level)
	{
		if ($this->publishedByFetcher) {
			return true;
		}
		if (!empty($this->closedTime) and !$this->testWriteLevel('close')) {
			return false;
		}

		if (!is_numeric($level)) {
			$level = isset(Streams::$ADMIN_LEVEL[$level])
				? Streams::$ADMIN_LEVEL[$level]
				: null;
			if (!isset($level)) {
				throw new Q_Exception_WrongValue(
					array(
						'field' => 'level', 
						'range' => 'one of: ' . implode(', ', array_keys(Streams::$ADMIN_LEVEL))
					)
				);
			}
		}

		$adminLevel = $this->get('adminLevel', 0);
		if ($adminLevel >= 0 and $adminLevel >= $level) {
			return true;
		}
		if (!$this->inheritAccess()) {
			return false;
		}
		$adminLevel_source = $this->get('adminLevel_source', 0);
		if ($adminLevel_source === Streams::$ACCESS_SOURCES['direct']
		or $adminLevel_source === Streams::$ACCESS_SOURCES['inherited_direct']) {
			return false;
		}
		$adminLevel = $this->get('adminLevel', 0);
		if ($adminLevel >= 0 and $adminLevel >= $level) {
			return true;
		}
		return false;
	}
	
	/**
	 * Calculate admin level to correspond to Streams::$ADMIN_LEVEL
	 * Primarily used by apps which invite a user to a stream
	 * and giving them a slightly lower admin level.
	 * @method lowerAdminLevel
	 */
	function lowerAdminLevel()
	{
		$this->inheritAccess();
		$current_level = $this->get('adminLevel', 0);
		$lower_level = 0;
		foreach (Streams::$ADMIN_LEVEL as $k => $v) {
			if ($v < $current_level) {
				$lower_level = $v;
			}
		}
	}
	
	/**
	 * Inherits access from any streams specified in the inheritAccess field.
	 * @method inheritAccess
	 * @return {boolean}
	 *  Returns whether the access potentially changed.
	 */
	function inheritAccess()
	{
		if (empty($this->inheritAccess)) {
			return false;
		}
		$names = json_decode($this->inheritAccess, true);
		if (!$names) {
			return false;
		}
		$public_source = Streams::$ACCESS_SOURCES['public'];
		$contact_source = Streams::$ACCESS_SOURCES['contact'];
		$direct_source = Streams::$ACCESS_SOURCES['direct'];
		$inherited_public_source = Streams::$ACCESS_SOURCES['inherited_public'];
		$inherited_contact_source = Streams::$ACCESS_SOURCES['inherited_contact'];
		$inherited_direct_source = Streams::$ACCESS_SOURCES['inherited_direct'];
		
		$readLevel = $this->get('readLevel', 0);
		$writeLevel = $this->get('writeLevel', 0);
		$adminLevel = $this->get('adminLevel', 0);
		$readLevel_source = $this->get('readLevel_source', $public_source);
		$writeLevel_source = $this->get('writeLevel_source', $public_source);
		$adminLevel_source = $this->get('adminLevel_source', $public_source);
		
		// Inheritance only goes one "generation" here.
		// To implement several "generations" of inheritance, you can do things like:
		// 'inheritAccess' => '["grandparent_streamName", "parent_stream_same"]'
		foreach ($names as $name) {
			if (is_array($name)) {
				$publisherId = reset($name);
				$name = next($name);
			} else {
				$publisherId = $this->publisherId;
			}
			$streams = Streams::fetch(
				$this->get('asUserId', ''),
				$publisherId,
				$name,
				'*'
			);
			foreach (array($streams) as $stream) {
				$s_readLevel = $stream->get('readLevel', 0);
				$s_writeLevel = $stream->get('writeLevel', 0);
				$s_adminLevel = $stream->get('adminLevel', 0);
				$s_readLevel_source = $stream->get('readLevel_source', $public_source);
				$s_writeLevel_source = $stream->get('writeLevel_source', $public_source);
				$s_adminLevel_source = $stream->get('adminLevel_source', $public_source);

				// Inherit read, write and admin levels
				// But once we inherit a level with direct_source or inherited_direct_source,
				// we don't override it anymore.
				if ($readLevel_source !== $inherited_direct_source) {
					$readLevel = ($s_readLevel_source === $direct_source)
						? $s_readLevel
						: max($readLevel, $s_readLevel);
					$readLevel_source = ($s_readLevel_source > $inherited_public_source)
						? $s_readLevel_source
						: $s_readLevel_source + $inherited_public_source;
				}
				if ($writeLevel_source !== $inherited_direct_source) {
					$writeLevel = ($s_writeLevel_source === $direct_source)
						? $s_writeLevel
						: max($writeLevel, $s_writeLevel);
					$writeLevel_source = ($s_writeLevel_source > $inherited_public_source)
						? $s_writeLevel_source
						: $s_writeLevel_source + $inherited_public_source;
				}
				if ($adminLevel_source !== $inherited_direct_source) {
					$adminLevel = ($s_adminLevel_source === $direct_source)
						? $s_adminLevel
						: max($adminLevel, $s_adminLevel);
					$adminLevel_source = ($s_adminLevel_source > $inherited_public_source)
						? $s_adminLevel_source
						: $s_adminLevel_source + $inherited_public_source;
				}
			}
		}
		
		$this->set('readLevel', $readLevel);
		$this->set('writeLevel', $writeLevel);
		$this->set('adminLevel', $adminLevel);
		$this->set('readLevel_source', $readLevel_source);
		$this->set('writeLevel_source', $writeLevel_source);
		$this->set('adminLevel_source', $adminLevel_source);
		
		return true;
	}
	
	/**
	 * Fetch all the streams which are related to, or from, this stream.
	 * @method related
	 * @static
	 * @param {string} $asUserId
	 *  The user who is fetching
	 * @param {string} $publisherId
	 *  An array of criteria that includes either
	 * @param {string} $toStreamName
	 *  The name of the category
	 * @param {mixed} $isCategory
	 *  If false, returns the categories that this stream is related to.
	 *  If true, returns all the streams this related to this category.
	 *  If a string, returns all the streams related to this category with names prefixed by this string.
	 * @param {array} $options=array()
	 *	'limit' =>  number of records to fetch
	 *	'offset' => offset to start
	 *  'orderBy' => defaults to false, which means order by descending weight
	 *  'type' =>  if specified, this filters the type of the relation
	 *  'prefix' => if specified, this filters by the prefix of the related streams
	 *	'where' =>  you can also specify any extra conditions here
	 *  'extra' => An array of any extra options to pass to Streams::fetch when fetching streams
	 *	'relationsOnly' =>  If true, returns only the relations to/from stream, doesn't fetch the streams.
	 *		Useful if publisher id of relation objects is not the same as provided by publisherId.
	 *  'streamsOnly' => If true, returns only the streams related to/from stream, doesn't return the relations.
	 *      Useful for shorthand in while( ) statements.
	 *  'streamFields' => If specified, fetches only the fields listed here for any streams
	 *  'skipFields' => Optional array of field names. If specified, skips these fields when fetching streams
	 * @return {array}
	 *  Returns array($relations, $relatedStreams, $this)
	 */
	function related(
		$asUserId,
		$isCategory = true,
		$options = array())
	{
		return Streams::related(
			$asUserId,
			$this->publisherId,
			$this->name,
			$isCategory,
			$options
		);
	}
	
	function relateTo($toStream, $type, $asUserId = null, $options = array())
	{
		return Streams::relate(
			$asUserId,
			$toStream->publisherId,
			$toStream->name,
			$type,
			$this->publisherId,
			$this->name,
			$options
		);
	}
	
	function relateFrom($fromStream, $type, $asUserId = null, $options = array()) {
		return Streams::relate(
			$asUserId,
			$this->publisherId,
			$this->name,
			$type,
			$fromStream->publisherId,
			$fromStream->name,
			$options
		);
	}
	
	function unrelateTo($toStream, $type, $asUserId = null, $options = array())
	{
		return Streams::unrelate(
			$asUserId,
			$toStream->publisherId,
			$toStream->name,
			$type,
			$this->publisherId,
			$this->name,
			$options
		);
	}
	
	function unrelateFrom($fromStream, $type, $asUserId = null, $options = array()) {
		return Streams::unrelate(
			$asUserId,
			$this->publisherId,
			$this->name,
			$type,
			$fromStream->publisherId,
			$fromStream->name,
			$options
		);
	}
	
	/**
	 * Closes a stream, which prevents anyone from posting messages to it
	 * unless they have WRITE_LEVEL >= "close", as well as attempting to remove
	 * all relations to other streams. A "cron job" can later go and delete
	 * closed streams. The reason you should avoid deleting streams right away
	 * is that other subscribers may still want to receive the last messages
	 * posted to the stream.
	 * @method close
	 * @param {string} $asUserId The id of the user who would be closing the stream
	 * @param {array} [$options=array()] Can include "skipAccess"
	 * @static
	 */
	function close($asUserId, $options = array())
	{
		return Streams::close($asUserId, $this->publisherId, $this->name, $options);
	}
	
	/**
	 * Returns array of fields allowed for user
	 * @method exportArray
	 * @param {array} $options=array()
	 *  Options can include:
	 *  "asUserId" => Defaults to the logged in user, or "" if not logged in
	 *	If access is not set for the stream it will be calculated for <code>$asUserId</code>
	 * @return {array}
	 */
	function exportArray($options = null)
	{
		$asUserId = isset($options['asUserId']) ? $options['asUserId'] : null;
		if (!isset($asUserId)) {
			$user = Users::loggedInUser();
			$asUserId = $user ? $user->id : '';
		}
		$this->calculateAccess($asUserId);
		if ($this->testReadLevel('content')) {
			$result = $this->toArray();
			$result['icon'] = $this->iconUrl();
		} else {
			if (!$this->testReadLevel('see')) {
				return array();
			}
			$result = array();
			$default = array( // the array of fields allowed to see
				'publisherId',
				'name',
				'type',
				'title',
				'icon',
				'messageCount',
				'participantCount',
				'insertedTime',
				'updatedTime'
			);
			if (isset($this->type)) {
				$fields = array_merge($default, Q_Config::get('Streams', 'types', $this->type, 'see', array()));
			}
			foreach ($fields as $field) {
				$result[$field] = ($field === 'icon')
					? $this->iconUrl()
					: $this->$field;
			}
		}
		$classes = Streams::getExtendClasses($this->type);
		$fieldNames = array();
		foreach ($classes as $k => $v) {
			foreach ($v as $f) {
				foreach ($fieldNames as $key) {
					$result[$f] = isset($this->$f) ? $this->$f : null;
				}
			}
		}
		$result['access'] = array(
			'readLevel' => $this->get('readLevel', $this->readLevel),
			'writeLevel' => $this->get('writeLevel', $this->writeLevel),
			'adminLevel' => $this->get('adminLevel', $this->adminLevel)
		);
		return $result;
	}

	/**
	 * Set access data for the stream. Access data is calculated:
	 *	<ol>
	 * 		<li>from read/write/admin level fields of the stream</li>
	 *		<li>from labels. Streams_Access record may contain &lt;publisherId&gt;, &lt;streamName&gt;
	 *			(allowed exact match or generic name "&lt;streamType&gt;/") and 
	 *			&lt;ofContactLabel&gt;. If &lt;publisherId&gt; is recorded in Users_Contact
	 *			to have either current user or &lt;ofContactLabel&gt; as contact, access claculation is 
	 *			considering such record.</li>
	 *		<li>from user. Stream_Access record may contain &lt;publisherId&gt;, &lt;streamName&gt;
	 *			(allowed exact match or generic name "&lt;streamType&gt;/") and 
	 *			&lt;ofUserId&gt;. Such record is considered in access calculation.</li>
	 *	</ol>
	 * @method calculateAccess
	 * @param {string} $asUserId=null The user relative to whom the access is calculated
	 *  If this matches the publisherId, just sets full access and calls publishedByFetcher(true).
	 *  If this is '', only returns the streams anybody can see.
	 *  If this is null, the logged-in user's id is used, or '' if no one is logged in
	 * @param {boolean} $recalculate=false Pass true here to force recalculating even if access was already calculated
	 * @chainable
	 */
	function calculateAccess($asUserId = null, $recalculate = false)
	{
		Streams::calculateAccess($asUserId, $this->publisherId, array($this), $recalculate);
		return $this;
	}
	
	/**
	 * Fetch messages of the stream.
	 * @method getMessages
	 * @param {array} [options=array()] An array of options determining how messages will be fetched, which can include:
	 *   "min" => Minimum ordinal of the message to select from (inclusive). Defaults to minimum ordinal of existing messages (if any).
	 *   "max" => Maximum ordinal of the message to select to (inclusive). Defaults to maximum ordinal of existing messages (if any).
	 *   Can also be negative, then the value will be substracted from maximum number of existing messages and +1 will be added
	 *   to guarantee that $max = -1 means highest message ordinal.
	 *   "limit" => Number of the messages to be selected. Defaults to 1000.
	 *   "ascending" => Sorting of fetched messages by ordinal. If true, sorting is ascending, if false - descending.
	 *   Defaults to true, but in case if 'min' option not given and only 'max' and 'limit' are given, we assuming
	 *   fetching in reverse order, so 'ascending' will default to false.
	 *   "type" => Optional string specifying the particular type of messages to get
	 */
	function getMessages($options)
	{
		// preparing default query
		$criteria = array(
			'publisherId' => $this->publisherId,
			'streamName' => $this->name
		);
		if (!empty($options['type'])) {
			$criteria['type'] = $options['type'];
		}
		$q = Streams_Message::select('*')->where($criteria);
		
		// getting $min and $max
		$result = Streams_Message::select("MIN(ordinal) AS min, MAX(ordinal) AS max")
				->where($criteria)
				->fetchAll(PDO::FETCH_ASSOC);
		if (!$result[0]) return array();
		$min = (integer) $result[0]['min'];
		$max = (integer) $result[0]['max'];
		
		// default sorting is 'ORDER BY `ordinal` ASC', but it can be changed depending on options
		$ascending = true;
		if (!isset($options['min'])) {
			$options['min'] = $min;
			// if 'min' is not given, assume 'reverse' fetching, so $ascending is false
			$ascending = false;
		}
		if (!isset($options['max'])) {
			$options['max'] = $max;
		} else if ($options['max'] < 0) {
			// if 'max' is negative, substract value from existing maximum
			$options['max'] = $max + $options['max'] + 1;
		}
		if (empty($options['limit'])) {
			$options['limit'] = Q_Config::get(
				'Streams', 'defaults', 'getMessagesLimit', 1000
			);
		}
		
		if ($options['min'] > $options['max']) {
			return array();
		}
		
		$q->where(array(
			'ordinal >=' => $options['min'],
			'ordinal <=' => $options['max']
		));
		$q->limit($options['limit']);
		$q->orderBy('ordinal', isset($options['ascending']) ? $options['ascending'] : $ascending);
		return $q->fetchDbRows(null, '', 'ordinal');
	}

	/**
	 * Fetch participants of the stream.
	 * @method getParticipants
	 * @param {array} [options=array()] An array of options determining how messages will be fetched, which can include:
	 *   "state" => One of "invited", "participating", "left"
	 *   Can also be negative, then the value will be substracted from maximum number of existing messages and +1 will be added
	 *   to guarantee that $max = -1 means highest message ordinal.
	 *   "limit" => Number of the participants to be selected. Defaults to 1000.
	 *   "offset" => Number of the messages to be selected. Defaults to 1000.
	 *   "ascending" => Sorting of fetched participants by insertedTime. If true, sorting is ascending, if false - descending. Defaults to false.
	 *   "type" => Optional string specifying the particular type of messages to get
	 */
	function getParticipants($options)
	{
		$criteria = array(
			'publisherId' => $this->publisherId,
			'streamName' => $this->name
		);
		if (isset($options['state'])) {
			$possible_states = array('invited', 'participating', 'left');
			if (!in_array($options['state'], $possible_states)) {
				throw new Q_Exception_WrongValue(array(
					'field' => 'state',
					'range' => '"' . implode('", "', $possible_states) . '"'
				));
			}
			$criteria['state'] = $options['state'];
		}
		$q = Streams_Participant::select('*')->where($criteria);
		$ascending = false;
		if (empty($options['limit'])) {
			$options['limit'] = 1000;
		}
		$limit = isset($options['limit']) ? $options['limit'] : null;
		$offset = isset($options['offset']) ? $options['offset'] : 0;
		if (isset($limit)) {
			$q->limit($options['limit'], $offset);
		}
		$q->orderBy('insertedTime', isset($options['ascending']) ? $options['ascending'] : $ascending);
		return $q->fetchDbRows(null, '', 'userId');
	}
	
	/**
	 * Get the url of the stream's icon
	 * @param {string} [$basename=""] The last part after the slash, such as "50.png"
	 * @return {string} The stream's icon url
	 */
	function iconUrl($basename = null)
	{
		if (empty($this->icon)) return null;
		$url = (Q_Valid::url($this->icon))
			? $this->icon
			: "plugins/Streams/img/icons/{$this->icon}";
		if ($basename) {
			if (strpos($basename, '.') === false) {
				$basename = "$basename.png";
			}
			$url .= "/$basename";
		}
		return Q_Html::themedUrl($url);
	}
	
	/**
	 * A convenience method to get the URL of the streams-related action
	 * @method register
	 * @static
	 * @param {string} $what
	 *	Defaults to 'stream'. In the future, can be 'message', 'relation', etc.
	 * @return {string} 
	 *	The corresponding URL
	 */
	function actionUrl($what = 'stream')
	{
		return Streams::actionUrl($this->publisherId, $this->name, $what);
	}
	
	/**
	 * Add this stream to the list of streams to be preloaded onto the client with the rest of the page
	 * @method addPreloaded
	 * @param {string} $asUserId=null
	 *	The id of the user from whose point of view the access should be calculated.
	 *  If this matches the publisherId, just sets full access and calls publishedByFetcher(true).
	 *  If this is '', only returns the streams anybody can see.
	 *  If this is null, the logged-in user's id is used, or '' if no one is logged in
	 */
	function addPreloaded($asUserId=null)
	{
		$this->calculateAccess($asUserId);
		self::$preloaded["{$this->publisherId}, {$this->name}"] = $this;
	}
	
	/**
	 * Remove this stream from the list of streams to be preloaded onto the client with the rest of the page
	 * @method addPreloaded
	 */
	function removePreloaded()
	{
		unset(self::$preloaded["{$this->publisherId}, {$this->name}"]);
	}

	/* * * */
	/**
	 * Implements the __set_state method, so it can work with
	 * with var_export and be re-imported successfully.
	 * @method __set_state
	 * @param {array} $array
	 * @return {Streams_Stream} Class instance
	 */
	static function __set_state(array $array) {
		$result = new Streams_Stream();
		foreach($array as $k => $v)
			$result->$k = $v;
		return $result;
	}
	
	/**
	 * @property $preloaded
	 * @static
	 * @type array
	 */
	static $preloaded = array();
};
