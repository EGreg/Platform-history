<?php

/**
 * Static methods for the Streams models.
 * This description should be revised and expanded.
 *
 * @module Streams
 * @class Streams
 * @extends Base_Streams
 * @abstract
 */
abstract class Streams extends Base_Streams
{
	/*
	 * This is where you would place all the static methods for the models,
	 * the ones that don't strongly pertain to a particular row or table.
	 
	 */

	/**
	 * Read levels
	 * @property $READ_LEVEL
	 * @type array
	 */
	/**
	 * Can't see the stream
	 * @config $READ_LEVEL['none']
	 * @type integer
	 * @default 0
	 * @final
	 */
	/**
	 * Can see icon and title
	 * @config $READ_LEVEL['see']
	 * @type integer
	 * @default 10
	 * @final
	 */
	/**
	 * Can preview stream and its content
	 * @config $READ_LEVEL['content']
	 * @type integer
	 * @default 20
	 * @final
	 */
	/**
	 * Can see participants in the stream
	 * @config $READ_LEVEL['participants']
	 * @type integer
	 * @default 30
	 * @final
	 */
	/**
	 * Can play stream in a player
	 * @config $READ_LEVEL['messages']
	 * @type integer
	 * @default 40
	 * @final
	 */
	public static $READ_LEVEL = array(
		'none' => 0,						// can't see the stream
		'see' => 10,						// can see icon and title
		'content' => 20,					// can preview stream and its content
		'participants' => 30,				// can see participants in the stream
		'messages' => 40					// can play stream in a player
	);
	/**
	 * Write levels
	 * @property $WRITE_LEVEL
	 * @type array
	 */
	/**
	 * Cannot affect stream or participants list
	 * @config $WRITE_LEVEL['none']
	 * @type integer
	 * @default 0
	 * @final
	 */
	/**
	 * Can become a participant, chat, and leave
	 * @config $WRITE_LEVEL['join']
	 * @type integer
	 * @default 10
	 * @final
	 */
	/**
	 * Can vote for a relation message posted to the stream.
	 * @config WRITE_LEVEL['vote']
	 * @type integer
	 * @default 13
	 * @final
	 */
	/**
	 * Can post messages, but manager must approve
	 * @config $WRITE_LEVEL['postPending']
	 * @type integer
	 * @default 15
	 * @final
	 */
	/**
	 * Can post messages which appear immediately
	 * @config $WRITE_LEVEL['post']
	 * @type integer
	 * @default 20
	 * @final
	 */
	/**
	 * Can post messages relating other streams to this one
	 * @config WRITE_LEVEL['relate']
	 * @type integer
	 * @default 23
	 * @final
	 */
	/**
	 * Can post messages requesting edits of stream
	 * @config $WRITE_LEVEL['editPending']
	 * @type integer
	 * @default 25
	 * @final
	 */
	/**
	 * Can post messages to edit stream content immediately
	 * @config $WRITE_LEVEL['edit']
	 * @type integer
	 * @default 30
	 * @final
	 */
	/**
	 * Can post a message requesting to close the stream
	 * @config $WRITE_LEVEL['closePending']
	 * @type integer
	 * @default 35
	 * @final
	 */
	/**
	 * Don't delete, just prevent any new changes to stream
	 * however, joining and leaving is still ok
	 * @config $WRITE_LEVEL['close']
	 * @type integer
	 * @default 40
	 * @final
	 */
	public static $WRITE_LEVEL = array(
		'none' => 0,						// cannot affect stream or participants list
		'join' => 10,						// can become a participant, chat, and leave
		'vote' => 13,						// can vote for a relation message posted to the stream
		'postPending' => 15,				// can post messages, but manager must approve
		'post' => 20,						// can post messages which appear immediately
		'relate' => 23,						// can post messages relating other streams to this one
		'editPending' => 25,				// can post messages requesting edits of stream
		'edit' => 30,						// can post messages to edit stream content immediately
		'closePending' => 35,				// can post a message requesting to close the stream
		'close' => 40						// don't delete, just prevent any new changes to stream
											// however, joining and leaving is still ok
	);
	/**
	 * Admin levels
	 * @property $ADMIN_LEVEL
	 * @type array
	 */
	/**
	 * Cannot do anything related to admin / users
	 * @config $ADMIN_LEVEL['none']
	 * @type integer
	 * @default 0
	 * @final
	 */
	/**
	 * Can post on your stream about participating
	 * @config $ADMIN_LEVEL['tell']
	 * @type integer
	 * @default 10
	 * @final
	 */
	/**
	 * Able to create invitations for others, granting access
	 * @config $ADMIN_LEVEL['invite']
	 * @type integer
	 * @default 20
	 * @final
	 */
	/**
	 * Can approve posts and give people any adminLevel < 'manage'
	 * @config $ADMIN_LEVEL['manage']
	 * @type integer
	 * @default 30
	 * @final
	 */
	/**
	 * Can give people any adminLevel <= 'own'
	 * @config $ADMIN_LEVEL['own']
	 * @type integer
	 * @default 40
	 * @final
	 */
	public static $ADMIN_LEVEL = array(
		'none' => 0,						// cannot do anything related to admin / users
		'tell' => 10,					// can post on your stream about participating
		'invite' => 20,						// able to create invitations for others, granting access
		'manage' => 30,						// can approve posts and give people any adminLevel < 30
		'own' => 40							// can give people any adminLevel <= 40
	);
	/**
	 * Access sources
	 * @property $ACCESS_SOURCES
	 * @type array
	 */
	/**
	 * Public access
	 * @config $ACCESS_SOURCES['public']
	 * @type integer
	 * @default 0
	 * @final
	 */
	/**
	 * From contact
	 * @config $ACCESS_SOURCES['contact']
	 * @type integer
	 * @default 1
	 * @final
	 */
	/**
	 * Direct access
	 * @config $ACCESS_SOURCES['direct']
	 * @type integer
	 * @default 2
	 * @final
	 */
	/**
	 * Inherited public access
	 * @config $ACCESS_SOURCES['inherited_public']
	 * @type integer
	 * @default 3
	 * @final
	 */
	/**
	 * Inherited from contact
	 * @config $ACCESS_SOURCES['inherited_contact']
	 * @type integer
	 * @default 4
	 * @final
	 */
	/**
	 * Inherited direct access
	 * @config $ACCESS_SOURCES['inherited_direct']
	 * @type integer
	 * @default 5
	 * @final
	 */
	public static $ACCESS_SOURCES = array(
		'public' => 0,
		'contact' => 1,
		'direct' => 2,
		'inherited_public' => 3,
		'inherited_contact' => 4,
		'inherited_direct' => 5
	);

	/**
	 * Fetches streams from the database.
	 * @method fetch
	 * @static
	 * @param {string} $asUserId
	 *  Set this to the user for which you are fetching the streams.
	 *  If this matches the publisherId, just returns the streams.
	 *  If this is '', only returns the streams anybody can see.
	 *  Otherwise, return the streams joined with the calculated access settings.
	 * @param {string} $publisherId
	 *  The id of the user publishing these streams
	 * @param {string|array|Db_Range} $name='Streams/user/'
	 *  If it ends in '/', then this function will return all streams that begin with $name.
	 *  Otherwise, it is the exact stream's name.
	 *  Also it can be an array of stream names, or a custom Db_Range for stream names
	 * @param {string} $fields='*'
	 *  Must include "publisherId" and "name" fields, since they
	 *  make up the primary key of the stream table.
	 * @param {array} $options=array()
	 *  Optional. Defaults to array().
	 *  Provide additional stream selection options like 'limit', 'offset', 'orderBy', 'where' etc.
	 *  Also can have the following options:
	 *  "includeTemplate" => Set to true if you want to include the template when $name ends in a slash
	 *  "refetch" => Ignore cache of previous calls to fetch, and save a new cache if necessary
	 *  See Query/Mysql::options().
	 * @return {array}
	 *  Returns an array of Streams_Stream objects with access info calculated
	 *  specifically for $asUserId .
	 *  Make sure to call the methods testReadLevel(), testWriteLevel() and testAdminLevel()
	 *  on these streams before using them on the user's behalf.
	 */
	static function fetch(
		$asUserId,
		$publisherId,
		$name = 'Streams/user/',
		$fields = '*',
		$options = array())
	{
		if (!isset($asUserId) or !isset($publisherId)) {
			return null;
		}
		$key = is_string($name) ? $name : Q::json_encode($name);
		if (empty($options['refetch'])
		and isset(self::$fetch[$asUserId][$publisherId][$key][$fields])) {
			return self::$fetch[$asUserId][$publisherId][$key][$fields];
		}

		$criteria = array(
			'publisherId' => $publisherId,
			'name' => $name
		);

		if (is_string($name)) {
			if (substr($name, -1) === '/') {
				$includeTemplate = !empty($options['includeTemplate']);
				$criteria['name'] = new Db_Range($name, $includeTemplate, false, true);
			}
		}

		// Get streams and set their default access info
		$streams = Streams_Stream::select($fields)
			->where($criteria)
			->ignoreCache()
			->options($options)
			->fetchDbRows(null, '', 'name');

		Streams::calculateAccess($asUserId, $publisherId, $streams, false);

		if (is_array($name)) {
			// put the streams back in the same internal PHP array order
			// and in the process honor any duplicate names that might have been passed
			$temp = $streams;
			$streams = array();
			foreach ($name as $n) {
				$streams[$n] = isset($temp[$n]) ? $temp[$n] : null;
			}
		}

		$types = array();
		foreach ($streams as $stream) {
			if ($stream) {
				$types[] = $stream->type;
			}
		}

		foreach ($types as $type) {
			/**
			 * @event Streams/fetch/$streamType {after}
			 * @param {&array} 'streams'
			 * @param {string} 'asUserId'
			 * @param {string} 'publisherId'
			 * @param {string} 'name'
			 * @param {array} 'criteria'
			 * @param {string} 'fields'
			 * @param {array} 'options'
			 */
			Q::event("Streams/fetch/$type", array(
				'streams' => &$streams,
				'asUserId' => $asUserId,
				'publisherId' => $publisherId,
				'name' => $name,
				'criteria' => $criteria,
				'fields' => $fields,
				'options' => $options
			), 'after');
		}

		if (empty($options)) {
			self::$fetch[$asUserId][$publisherId][$key][$fields] = $streams;
		}
		return $streams;
	}
	
	/**
	 * Fetches one stream from the database.
	 * @method fetch
	 * @static
	 * @param {string} $asUserId
	 *  Set this to the user for which you are fetching the streams.
	 *  If this matches the publisherId, just returns the streams.
	 *  If this is '', only returns the streams anybody can see.
	 *  Otherwise, return the streams joined with the calculated access settings.
	 * @param {string} $publisherId
	 *  The id of the user publishing these streams
	 * @param {string|array|Db_Range} $name='Streams/user/'
	 *  If it ends in '/', then this function will return all streams that begin with $name.
	 *  Otherwise, it is the exact stream's name.
	 *  Also it can be an array of stream names, or a custom Db_Range for stream names
	 * @param {string} $fields='*'
	 *  Must include "publisherId" and "name" fields, since they
	 *  make up the primary key of the stream table.
	 * @param {array} $options=array()
	 *  Optional. Defaults to array().
	 *  Provide additional stream selection options like 'limit', 'offset', 'orderBy', 'where' etc.
	 *  Also can have the following options:
	 *  "includeTemplate" => Set to true if you want to include the template when $name ends in a slash
	 *  See Query/Mysql::options().
	 * @return {array}
	 *  Returns an array of Streams_Stream objects with access info calculated
	 *  specifically for $asUserId .
	 *  Make sure to call the methods testReadLevel(), testWriteLevel() and testAdminLevel()
	 *  on these streams before using them on the user's behalf.
	 */
	static function fetchOne(
		$asUserId,
		$publisherId,
		$name = 'Streams/user/',
		$fields = '*',
		$options = array())
	{
		$options['limit'] = 1;
		$streams = Streams::fetch($asUserId, $publisherId, $name, $fields, $options);
		if (empty($streams)) {
			return false;
		}
		return reset($streams);
	}
	
	/**
	 * Calculates the access for one or more streams by querying the database
	 * Modifies the objects in the $streams array, setting their access levels.
	 * After the function returns, you will be able to call the methods
	 * testReadLevel(), testWriteLevel() and testAdminLevel()
	 * on these streams before using them on the user's behalf.
	 * @method fetch
	 * @static
	 * @param {string} $asUserId
	 *  Set this to the user relative to whom access is calculated.
	 *  If this matches the publisherId, just sets full access and calls publishedByFetcher(true).
	 *  If this is '', only returns the streams anybody can see.
	 *  Otherwise, return the streams joined with the calculated access settings.
	 * @param {string} $publisherId
	 *  The id of the user publishing these streams
	 * @param {array} $streams
	 *  An array of streams, obtained for example by Streams::fetch
	 * @param {boolean} $recalculate=false
	 *  Pass true here to force recalculating access to streams for which access was already calculated
	 * @return integer
	 *  The number of streams that were recalculated
	 */
	static function calculateAccess(
		$asUserId,
		$publisherId,
		$streams,
		$recalculate = false)
	{
		if ($recalculate) {
			$streams2 = $streams;
		} else {
			$streams2 = array();
			foreach ($streams as $k => $s) {
				if ($s->get('readLevel', null) === null) {
					$streams2[$k] = $s;
				}
			}
		}
		if (empty($streams2)) {
			return 0;
		}
		
		$public_source = Streams::$ACCESS_SOURCES['public'];
		$contact_source = Streams::$ACCESS_SOURCES['contact'];
		$direct_source = Streams::$ACCESS_SOURCES['direct'];

		$streams3 = array();
		$names = array();
		$types = array();
		foreach ($streams2 as $s) {
			$s->set('asUserId', $asUserId);
			if ($asUserId and $asUserId == $publisherId) {
				// The publisher should have full access to every one of their streams.
				$s->publishedByFetcher(true);
				continue;
			}
			$s->set('readLevel', $s->readLevel);
			$s->set('writeLevel', $s->writeLevel);
			$s->set('adminLevel', $s->adminLevel);
			$s->set('readLevel_source', $public_source);
			$s->set('writeLevel_source', $public_source);
			$s->set('adminLevel_source', $public_source);
			if (empty($asUserId)) {
				continue; // No need to fetch further access info.
			}

			$names[] = $s->name;
			$types[] = $s->type."/";
			$streams3[] = $s;
		}
		
		if (empty($names)) return count($streams2);

		// Get the per-label access data
		// Avoid making a join to allow more flexibility for sharding
		$accesses = Streams_Access::select('*')
		->where(array(
			'publisherId' => $publisherId,
			'streamName' => $names,
			'ofUserId' => array('', $asUserId)
		))->fetchDbRows();

		$labels = array();
		foreach ($accesses as $access) {
			if ($access->ofContactLabel) {
				$labels[] = $access->ofContactLabel;
			}
		}
		if (!empty($labels)) {
			$labels = array_unique($labels);
			$contacts = Users_Contact::select('*')
				->where(array(
					'userId' => $publisherId,
					'label' => $labels,
					'contactUserId' => $asUserId
				))->fetchDbRows();
			foreach ($contacts as $contact) {
				foreach ($accesses as $access) {
					if ($access->ofContactLabel !== $contact->label) {
						continue;
					}
					foreach ($streams3 as $stream) {
						if ($stream->name !== $access->streamName) {
							continue;
						}
						$readLevel = $stream->get('readLevel', 0);
						$writeLevel = $stream->get('writeLevel', 0);
						$adminLevel = $stream->get('adminLevel', 0);
						if ($access->readLevel >= 0 and $access->readLevel > $readLevel) {
							$stream->set('readLevel', $access->readLevel);
							$stream->set('readLevel_source', $contact_source);
						}
						if ($access->writeLevel >= 0 and $access->writeLevel > $writeLevel) {
							$stream->set('writeLevel', $access->writeLevel);
							$stream->set('writeLevel_source', $contact_source);
						}
						if ($access->adminLevel >= 0 and $access->adminLevel > $adminLevel) {
							$stream->set('adminLevel', $access->adminLevel);
							$stream->set('adminLevel_source', $contact_source);
						}
					}
				}
			}
		}
	
		// Override with per-user access data
		foreach ($accesses as $access) {
			foreach ($streams3 as $stream) {
				if ($stream->name !== $access->streamName) {
					continue;
				}
				if ($access->ofUserId === $asUserId) {
					if ($access->readLevel >= 0) {
						$stream->set('readLevel', $access->readLevel);
						$stream->set('readLevel_source', $direct_source);
					}
					if ($access->writeLevel >= 0) {
						$stream->set('writeLevel', $access->writeLevel);
						$stream->set('writeLevel_source', $direct_source);
					}
					if ($access->adminLevel >= 0) {
						$stream->set('adminLevel', $access->adminLevel);
						$stream->set('adminLevel_source', $direct_source);
					}
				}
			}
		}
		return count($streams2);
	}
	
	/**
	 * Calculates whether a given user is authorized by a specific publisher
	 * to create a particular type of stream.
	 * @method fetch
	 * @static
	 * @param {string} $userId The user who would be creating the stream.
	 * @param {string} $publisherId The id of the user who would be publishing the stream.
	 * @param {string} $streamType The type of the stream that would be created
	 * @param {array} $relate The user would also be authorized if the stream would be related to
	 *  an existing category stream, in which the user has a writeLevel of at least "relate",
	 *  and the user that would be publishing this new stream has a template for this stream type
	 *  that is related to the category stream or a template matching the category stream.
	 *  To test for this, pass an array with the following keys:
	 *   "streamName" => The name of the stream to which the new stream would be related
	 *   "publisherId" => The id of the user publishing that stream, defaults to $publisherId
	 *   "type" => The type of relation, defaults to ""
	 * @return {Streams_Stream|boolean} Returns a stream template the user must use,
	 *  otherwise a boolean true/false to indicate a yes or no regardless of template.
	 */
	static function isAuthorizedToCreate(
		$userId,
		$publisherId,
		$streamType,
		$relate = array())
	{
		$authorized = false;
		if (!empty($relate['streamName'])) {
			if (empty($relate['publisherId'])) {
				$relate['publisherId'] = $publisherId;
			}
			if (empty($relate['type'])) {
				$relate['type'] = '';
			}
		}
		if ($publisherId == $userId) {
			$authorized = true; // user can publish streams under their own name
		}
		if (!$authorized) {
			// Check for permissions using templates
			$template = new Streams_Stream();
			$template->publisherId = $publisherId;
			$template->name = $streamType.'/';
			$template->type = 'Streams/template';
			$retrieved = $template->retrieve();
			if (!$retrieved) {
				$template->publisherId = '';
				$retrieved = $template->retrieve();
			}
			if ($retrieved) {
				$template->calculateAccess($userId);
				if ($template->testAdminLevel('own')) {
					$authorized = $template;
				}
			}
		}
		if (!$authorized and $retrieved and $relate['streamName']) {
			// Check if user is perhaps authorized to create a related stream
			$to_stream = Streams::fetchOne($userId, $relate['publisherId'], $relate['streamName']);
			if ($to_stream and $to_stream->testWriteLevel('relate')) {
				$to_template = new Streams_Stream();
				$to_template->publisherId = $to_stream->publisherId;
				$to_template->name = $to_stream->type.'/';
				$to_template->type = 'Streams/template';
				$retrieved = $to_template->retrieve();
				if (!$retrieved) {
					$to_template->publisherId = '';
					$retrieved = $to_template->retrieve();
				}
				if ($retrieved) {
					$related_to = new Streams_RelatedTo();
					$related_to->toPublisherId = $to_template->publisherId;
					$related_to->toStreamName = $to_template->name;
					$related_to->type = $relate['type'];
					$related_to->fromPublisherId = $template->publisherId;
					$related_to->fromStreamName = $template->name;
					if ($retrieved = $related_to->retrieve()) {
						$authorized = $template;
					}
				}
			}
		}	
		return $authorized;
	}

	/**
	 * Takes some information out of an existing set of streams
	 * @method take
	 * @static
	 * @param {array} $streams
	 * @param {string} $name
	 * @param {string} $readLevel
	 *  Test each stream for at least this read level.
	 *  If the test fails, return null in its stead.
	 * @param {string|array} $field='content'
	 *  Optional. Defaults to "content".
	 *  Can be an array of fields, in which case the function returns an array.
	 * @param {boolean} $escape=true
	 *  Defaults to false. If true, escapes the values as HTML
	 * @return {mixed}
	 *  Returns the value of the field, or an array of values, depending on
	 *  whether $field is an array or a string
	 */
	static function take(
		$streams,
		$name,
		$readLevel,
		$field = 'content',
		$escape = false)
	{
		if (!isset($streams[$name])) {
			return null;
		}
		$result = array();
		$was_array = is_array($field);
		$arr = $was_array ? $field : array($field);
		foreach ($arr as $f) {
			if (!isset($streams[$name]->$f))  {
				return null;
			}
			if (!$streams[$name]->testReadLevel($readLevel)) {
				return null;
			}
			$result[$f] = !$escape
				? $streams[$name]->$f
				: Q_Html::text($streams[$name]->$f);
		}
		return $was_array ? $result : reset($result);
	}

	/**
	 * Get all the streams starting with "Streams/user/" for a particular user
	 * @method forUser
	 * @static
	 * @param {string} $publisherId
	 *  The id of the user who is publishing the streams.
	 * @return {array}
	 */
	static function forUser($asUserId, $publisherId)
	{
		if (!isset($asUserId) or !isset($publisherId)) {
			return null;
		}
		return Streams::fetch($asUserId, $publisherId, 'Streams/user/', '*');
	}

	/**
	 * A shorthand to get fields from a stream, etc.
	 * @method my
	 * @static
	 * @param {string|array} $field='content'
	 *  Optional. Defaults to "content".
	 *  Can be an array of fields, in which case the function returns an array.
	 * @param {boolean} $escape=false
	 *  Defaults to false. If true, escapes as HTML
	 * @return {mixed}
	 *  Returns the value of the field, or an array of values, depending on
	 *  whether $field is an array or a string
	 */
	static function my($name, $field = 'content', $escape = false)
	{
		$user = Users::loggedInUser();
		if (!$user) {
			return null;
		}
		$streams = Streams::forUser($user->id, $user->id);
		// Since it's our stream, the testReadLevel will always succeed
		return Streams::take($streams, $name, 0, $field, $escape);
	}

	/**
	 * Get the publisher id from the request, if it can be deduced
	 * @method requestedPublisherId
	 * @static
	 * @param {boolean} $throw_if_missing=false
	 *  Optional. If true, throws an exception if the publisher id cannot be deduced
	 * @return {integer}
	 *  The id of the publisher user
	 * @throws {Users_Exception_NoSuchUser}
	 *  If the URI contains an invalid "username"
	 * @throws {Q_Exception_RequiredField}
	 *  If the username can't be deduced, this is thrown
	 */
	static function requestedPublisherId($throw_if_missing = false)
	{
		if (isset(self::$requestedPublisherId_override)) {
			return self::$requestedPublisherId_override;
		}
		$uri = Q_Dispatcher::uri();
		if (isset($_REQUEST['publisherId'])) {
			return $_REQUEST['publisherId'];
		} else if (isset($uri->publisherId)) {
			return $uri->publisherId;
		} else if (isset($uri->username)) {
			$publisher = new Users_User();
			$publisher->username = $uri->username; // Warning: SECONDARY_LOOKUP
			if (!$publisher->retrieve()) {
				throw new Users_Exception_NoSuchUser(array(), 'username');
			}
			return $publisher->id;
		}
		if (Streams::$followedInvite) {
			return Streams::$followedInvite->publisherId;
		}
		if ($throw_if_missing) {
			throw new Q_Exception_RequiredField(
				array('field' => 'publisher id'),
				'publisherId'
			);
		}
		return null;
	}

	/**
	 * Get the stream name from the request, if it can be deduced.
	 * Checks $_REQUEST['streamName'], then tries $_REQUEST['name'].
	 * If both are empty, tries Q_Dispatcher::uri() and returns "{$uri->name_prefix}{$uri->name}",
	 * which is useful when the URL contains just the last part of a stream's name.
	 * @method requestedName
	 * @static
	 * @param {boolean} $throw_if_missing=false
	 *  Optional. If true, throws an exception if the stream name cannot be deduced
	 * @param {string} $return_as
	 *  Defaults to "string". Can also be "array".
	 * @return {string}
	 *  The name of the stream
	 * @throws {Q_Exception_RequiredField}
	 *  If the name can't be deduced, this is thrown
	 */
	static function requestedName($throw_if_missing = false, $return_as = 'string')
	{
		if (isset(self::$requestedName_override)) {
			return self::$requestedName_override;
		}
		$uri = Q_Dispatcher::uri();
		if (isset($_REQUEST['streamName'])) {
			$result = $_REQUEST['streamName'];
		} else if (isset($_REQUEST['name'])) {
			$result = $_REQUEST['name'];
		} else if (isset($uri->name)) {
			if (is_array($uri->name)) {
				$result = implode('/', $uri->name);
			}
			$result = $uri->name;
		}
		if (isset($result)) {
			if ($return_as === 'string' and is_array($result)) {
				$result = implode('/', $result);
			}
			if ($return_as === 'array' and is_string($result)) {
				$result = explode('/', $result);
			}
			if (!is_string($result)) {
				return $result;
			}
			return isset($uri->name_prefix) ? $uri->name_prefix.$result : $result;
		}
		if (Streams::$followedInvite) {
			return Streams::$followedInvite->streamName;
		}
		if ($throw_if_missing) {
			throw new Q_Exception_RequiredField(
				array('field' => 'stream name'),
				'streamName'
			);
		}
		return null;
	}

	/**
	 * Get the stream type from the request, if it can be deduced
	 * @method requestedType
	 * @static
	 * @param {boolean} $throw_if_missing=false
	 *  Optional. If true, throws an exception if the stream type cannot be deduced
	 * @return {string}
	 *  The type of the stream
	 * @throws {Q_Exception_RequiredField}
	 *  If the type can't be deduced, this is thrown
	 */
	static function requestedType($throw_if_missing = false)
	{
		$uri = Q_Dispatcher::uri();
		if (isset($_REQUEST['streamType'])) {
			return $_REQUEST['streamType'];
		} else if (isset($_REQUEST['type'])) {
			return $_REQUEST['type'];
		} else if (isset($uri->type)) {
			return $uri->type;
		}
		if ($throw_if_missing) {
			throw new Q_Exception_RequiredField(
				array('field' => 'stream type'),
				'streamType'
			);
		}
		return null;
	}

	/**
	 * Get the message type from the request, if it can be deduced
	 * @method requestedType
	 * @static
	 * @param {boolean} $throw_if_missing=false
	 *  Optional. If true, throws an exception if the message type cannot be deduced
	 * @return {string}
	 *  The type of the message
	 * @throws {Q_Exception_RequiredField}
	 *  If the type can't be deduced, this is thrown
	 */
	static function requestedMessageType($throw_if_missing = false)
	{
		$uri = Q_Dispatcher::uri();
		if (isset($_REQUEST['type'])) {
			return $_REQUEST['type'];
		} else if (isset($uri->type)) {
			return $uri->type;
		}
		if ($throw_if_missing) {
			throw new Q_Exception_RequiredField(
				array('field' => 'message type'),
				array('type')
			);
		}
		return null;
	}

	/**
	 * Get the stream field from the request, if it can't be deduced throws error
	 * @method requestedField
	 * @static
	 * @param {string} $field
	 *	The fiels name
	 * @param {boolean} $throw_if_missing=false
	 *  Optional. If true, throws an exception if the stream field cannot be deduced
	 * @param {mixed} $default=null
	 *	Is returned if field is not set
	 * @return {string}
	 *  The value of the field
	 * @throws {Q_Exception_RequiredField}
	 *  If the field value can't be deduced, this is thrown
	 */
	static function requestedField($field, $throw_if_missing = false, $default = null)
	{
		$uri = Q_Dispatcher::uri();
		if (isset($_REQUEST[$field])) {
			return $_REQUEST[$field];
		} else if (isset($uri->$field)) {
			if (is_array($uri->$field)) {
				return implode('/', $uri->$field);
			}
			return $uri->$field;
		} else if ($field = Q_Request::special("Streams.$field", $default)) {
			return $field;
		}
		if ($throw_if_missing) {
			throw new Q_Exception_RequiredField(
				array('field' => "stream $field"),
				$field
			);
		}
		return $default;
	}

	/**
	 * Get the fields that have been requested in the request, otherwise '*'
	 * @method requestedFields
	 * @static
	 * @return {array|string}
	 *  An array or string of fields to select
	 * @throws {Q_Exception}
	 *	If requested field name is invalid
	 */
	static function requestedFields()
	{
		if (empty($_REQUEST['fields'])) {
			return '*';
		}
		$fields = explode(',', $_REQUEST['fields']);
		$fieldNames = Streams_Stream::fieldNames();
		foreach ($fields as $f) {
			if (!in_array($f, $fieldNames)){
				throw new Q_Exception("Invalid field name $f", 'fields');
			}
		}
		if (!in_array('publisherId', $fields)) {
			$fields[] = 'publisherId';
		}
		if (!in_array('name', $fields)) {
			$fields[] = 'name';
		}
		return $fields;
	}

	/**
	 * Produce user's display name
	 * @method displayName
	 * @static
	 * @param {string|Users_User} $user
	 *  Can be Users_User object or a string containing a user id
	 * @param {array} $streams=null
	 *  An array of streams fetched for this user.
	 *  If it is null, we fetch them as the logged-in user.
	 * @param {array} $options=array()
	 *  Associative array of options, which can include:<br/>
	 *  "fullAccess" => Ignore the access restrictions for the name<br/>
	 *  "short" => Only display the first name<br/>
	 *  "spans" => If true, encloses the first and last name in span tags<br/>
	 *  "escape" => If true, does HTML escaping of the retrieved fields
	 * @return {string|null}
	 */
	static function displayName($user, $streams=null, $options = array())
	{
		if (!$user) return null;
		if (is_string($user)) {
			$user = Users_User::getUser($user);
		}
		if (!$user) return null;

		$username = $user->username;
		$test_access = 'content';
		if (!empty($options['fullAccess'])) {
			$test_access = 0;
		}
		if (!isset($streams)) {
			$logged_in_user = Users::loggedInUser();
			$streams = Streams::fetch(
				$logged_in_user ? $logged_in_user->id : 0,
				$user->id,
				array('Streams/user/firstName', 'Streams/user/lastName')
			);
		}
		$escape = !empty($options['escape']);
		$fn = $firstName = Streams::take($streams, 'Streams/user/firstName', $test_access, 'content', $escape);
		$ln = $lastName = Streams::take($streams, 'Streams/user/lastName', $test_access, 'content', $escape);

		if (!empty($options['spans'])) {
			$firstName = "<span class='Streams_firstName'>$firstName</span>";
			$lastName = "<span class='Streams_lastName'>$lastName</span>";
		}

		if (!empty($options['short'])) {
			return $firstName ? $firstName : $username;
		}

		$username = !empty($username) ? "\"$username\"" : '';

		if ($fn and $ln) {
			return "$firstName $lastName";
		} else if ($fn and !$ln) {
			return $username ? "$firstName $username" : $firstName;
		} else if (!$fn and $ln) {
			return "$username $lastName";
		} else {
			return !empty($username) ? $username : null;
		}
	}

	/**
	 *
	 * @method displayUsers
	 * @static
	 * @param {array} $userIds
	 *  An array of user ids
	 * @return {array}
	 *  An array of Users_User objects, augmented with the requested streams.
	 *  Get the stream objects using $user->get($streamName)
	 */
	static function displayUsers($userIds)
	{
		$user = Users::loggedInUser();
		$users = Users_User::select('*')
			->where(array('id' => $userIds))
			->fetchDbRows(null, '', 'id');
		foreach ($userIds as $id) {
			$streams = self::forUser(
				$user ? $user->id : 0,
				$id
			);
			foreach ($streams as $stream) {
				$users[$id]->set($stream->name, $stream);
			}
		}
	}

	/**
	 * Updates the publisher's avatar, as it appears to $toUserId
	 * This function should be called during events that may cause the
	 * publisher's avatar to change appearance for certain users viewing it.
	 * These are usually rare events, and include things like:<br/>
	 *   adding, removing or modifying a contact
	 * @method updateAvatar
	 * @static
	 * @param {string} $publisherId
	 *  id of the publisher whose avatar to update
	 * @param {integer} $toUserId
	 *  id of the user who will be viewing this avatar
	 * @return {boolean}
	 */
	static function updateAvatar($publisherId, $toUserId)
	{
		if (isset(self::$users[$publisherId])) {
			$user = self::$users[$publisherId];
		} else {
			$user = new Users_User();
			$user->id = $publisherId;
			if (!$user->retrieve()) {
				return false;
			}
			self::$users[$publisherId] = $user;
		}

		// Fetch some streams as the contact user
		$fn_streams = Streams::fetch($toUserId, $publisherId, 'Streams/user/firstName');
		$ln_streams = Streams::fetch($toUserId, $publisherId, 'Streams/user/lastName');
		$firstName = Streams::take($fn_streams, 'Streams/user/firstName', 'content');
		$lastName = Streams::take($ln_streams, 'Streams/user/lastName', 'content');

		// Update the Streams_avatar table
		Streams_Avatar::update()->set(array(
			'firstName' => $firstName,
			'lastName' => $lastName,
			'username' => $user->username,
			'icon' => $user->icon
		))->where(array(
			'publisherId' => $publisherId,
			'toUserId' => $toUserId
		))->execute();

		return true;
	}

	/**
	 * Updates the publisher's avatars, which may have changed
	 * with the tainted_access_array.
	 * This function should be called during rare events that may cause the
	 * publisher's avatar to change appearance for certain users viewing it.<br/>
	 *
	 * You should rarely have to call this function. It is used internally by the model,
	 * in two main situations:
	 * <ol><li>
	 *    adding, removing or modifying a Streams_Access row for Streams/user/firstName or Streams/user/lastName
	 *    In this case, the function is able to update exactly the avatars that need updating.
	 * </li><li>
	 *    adding, removing or modifying a Stream row for Streams/user/firstName or Streams/user/lastName
	 *    In this case, there may be some avatars which this function will miss.
	 *    These correspond to users which are reachable by the access array for one stream,
	 *    but not the other. For example, if Streams/user/firstName is being updated, but
	 *    a particular user is reachable only by the access array for Streams/user/lastName, then
	 *    their avatar will not be updated and contain a stale value for firstName.
	 *    To fix this, the Streams_Stream model passes true in the 4th parameter to this function.
	 * </li></ol>
	 * @method updateAvatars
	 * @static
	 * @param {string} $publisherId
	 *  id of the publisher whose avatar to update
	 * @param {array} $access_array
	 *  array of Streams_Access objects representing access information that is either
	 *  about to be saved, are about to be overwritten, or will be deleted
	 * @param {string|Streams_Stream} $streamName
	 *  pass the stream name here. You can also pass a Stream_Stream object here,
	 *  in which case it will be used, instead of selecting that stream from the database.
	 * @param {boolean} $update_to_public_value=false
	 *  if you want to first update all the avatars for this stream
	 *  to the what the public would see, to avoid the situation described in 2).
	 */
	static function updateAvatars($publisherId, $access_array, $streamName, $update_to_public_value = false)
	{
		if (!isset($streamName)) {
			$stream_accesses = array();
			foreach ($access_array as $access) {
				$stream_accesses[$access->streamName][] = $access;
			}
			if (count($stream_accesses) > 1) {
				foreach ($stream_accesses as $k => $v) {
					self::updateAvatars($publisherId, $v, $k);
				}
				return false;
			}
		}
		if ($streamName instanceof Streams_Stream) {
			$stream = $streamName;
			$streamName = $stream->name;
		}

		// If we are here, all the Stream_Access objects have the same streamName
		if ($streamName !== 'Streams/user/firstName' and $streamName !== 'Streams/user/lastName') {
			// we don't care about access to other streams being updated
			return false;
		}
		$show_toUserIds = array();

		// Select the user corresponding to this publisher
		$user = new Users_User();
		$user->id = $publisherId;
		if (!$user->retrieve()) {
			throw new Q_Exception_MissingRow(array(
				'table' => 'user',
				'criteria' => 'id = '.$user->id
			));
		}

		// Obtain the stream object to use
		if (isset($stream)) {
			if (!isset($stream->content)) {
				$stream->content = '';
			}
		} else {
			// If the $stream isn't already defined, select it
			$stream = new Streams_Stream();
			$stream->publisherId = $publisherId;
			$stream->streamName = $streamName;
			if (!$stream->retrieve()) {
				// Strange, this stream doesn't exist.
				// Well, we will just silently set the content to '' then
				$stream->content = '';
			}
		}

		$content_readLevel = Streams::$READ_LEVEL['content'];
		$readLevels = array();
		$label_readLevels = array();
		$contact_label_list = array();
		$removed_labels = array();
		$db = Streams::db();

		// First, assign all the readLevels that are directly set for specific users,
		// and aggregate the contact_labels from the other accesses, for an upcoming select.
		foreach ($access_array as $access) {
			if ($userId = $access->ofUserId) {
				$readLevel = $access->readLevel;
				$readLevels[$userId] = $readLevel;
				if ($readLevel < 0) {
					$show_toUserIds[$userId] = null; // not determined yet
				} else if ($readLevel >= $content_readLevel) {
					$show_toUserIds[$userId] = true;
				} else {
					$show_toUserIds[$userId] = false;
				}
			} else if ($access->ofContactLabel) {
				$ofContactLabel = $access->ofContactLabel;
				$contact_label_list[] = $db->quote($ofContactLabel);
				if ($access->get('removed', false)) {
					$removed_labels[$ofContactLabel] = true;
				} else {
					$label_readLevels[$ofContactLabel] = $access->readLevel;
				}
			}
		}

		// Now, get all the people affected by this change, and their readLevels
		$readLevels2 = array();
		if ($contact_label_list) {
			$contact_label_list = array_unique($contact_label_list);
			$contacts = Users_Contact::select('*')
				->where(array(
					'userId' => $publisherId,
					'label' => $contact_label_list
				))->fetchDbRows(null, '', 'contactUserId');
			foreach ($contacts as $contact) {
				$contactUserId = $contact->contactUserId;
				if (isset($show_toUserIds[$contactUserId])) {
					// this user had their read level set directly by the access,
					// which overrides read levels set by access using ofContactLabel
					continue;
				}
				if (isset($removed_labels[$ofContactLabel])) {
					// this label doesn't affect readLevels anymore, since it was deleted
					// but put this contact's id on a list whose readLevels need to be determined
					$show_toUserIds[$contactUserId] = null;
					continue;
				}
				if (!isset($label_readLevels[$contact->label])) {
					continue;
				}
				$readLevel = $label_readLevels[$contact->label];
				if (!isset($readLevels2[$contactUserId])) {
					$readLevels2[$contactUserId] = $readLevel;
				} else {
					$readLevels2[$contactUserId] = max(
						$readLevels2[$contactUserId],
						$readLevel
					);
				}
			}
		}

		// Now step through all the users we found who were found through ofContactLabel
		// and make sure we update the avatar rows that were meant for them.
		foreach ($readLevels2 as $userId => $rl) {
			if ($rl >= $content_readLevel) {
				$show_toUserIds[$userId] = true;
			} else {
				// in order for this to happen, two things had to be true:
				// 1) there was no access that directly set a readLevel >= $content_readLevel
				// 2) there was no access that set a readLevel >= $content_readLevel for any label containing this user
				// therefore, their view should be the public view
				$show_toUserIds[$userId] = 'public';
			}
		}

		// Finally, resolve all the undertermined readLevels
		foreach ($show_toUserIds as $userId => $v) {
			if (!isset($v)) {
				// if the readLevel hasn't been determined by now, it's the same as the public one
				$show_toUserIds[$userId] = 'public';
			}
		}

		// Finally, set up the public avatar:
		if (!isset($stream->readLevel)) {
			$stream->readLevel = Streams_Stream::$DEFAULTS['readLevel'];
		}
		$show_toUserIds[0] = ($stream->readLevel >= $content_readLevel);

		// Now, we update the avatars:
		$field = ($streamName === 'Streams/user/firstName') ? 'firstName' : 'lastName';
		$rows = array();
		$remove_userIds = array();
		$rows_that_show = array();
		$rows_that_hide = array();
		$updates_that_show = array();
		$updates_that_hide = array();
		foreach ($show_toUserIds as $userId => $show) {
			if ($show === 'public') {
				// If no show is explicitly specified, use the value used for the rest of the public
				$show = $show_toUserIds[0];
			}
			if ($show === true) {
				$rows_that_show[] = array(
					'publisherId' => $publisherId,
					'toUserId' => $userId,
					'username' => $user->username,
					'icon' => $user->icon,
					'updatedTime' => new Db_Expression("CURRENT_TIMESTAMP"),
					$field => $stream->content
				);
			} else if ($show === false) {
				$rows_that_hide[] = array(
					'publisherId' => $publisherId,
					'toUserId' => $userId,
					'username' => $user->username,
					'icon' => $user->icon,
					'updatedTime' => new Db_Expression("CURRENT_TIMESTAMP"),
					$field => ''
				);
			}
		}
		$updates_that_show = array(
			'username' => $user->username,
			'icon' => $user->icon,
			'updatedTime' => new Db_Expression("CURRENT_TIMESTAMP"),
			$field => $stream->content
		);
		$updates_that_hide = array(
			'username' => $user->username,
			'icon' => $user->icon,
			'updatedTime' => new Db_Expression("CURRENT_TIMESTAMP"),
			$field => ''
		);

		// We are now ready to make changes to the database.
		if ($update_to_public_value) {
			Streams_Avatar::update()
				->set(array($field => $show_toUserIds[0] ? $stream->content : ''))
				->where(compact('publisherId'))
				->execute();
		}
		Streams_Avatar::insertManyAndExecute($rows_that_show, array('onDuplicateKeyUpdate' => $updates_that_show));
		Streams_Avatar::insertManyAndExecute($rows_that_hide, array('onDuplicateKeyUpdate' => $updates_that_hide));
	}

	/**
	 *
	 * @method getRelation
	 * @private
	 * @param {string} $asUserId
	 *  The user who is fetching
	 * @param {string} $toPublisherId
	 *  The publisher of the category
	 * @param {string} $toStreamName
	 *  The name of the category
	 * @param {string} $type
	 *  The type of the relation
	 * @param {string} $fromPublisherId
	 *  The publisher of the member stream(s)
	 * @param {string} $fromStreamName
	 *  The name of the member stream(s)
	 * @param {array} $options=array()
	 *  An array of options that can include:
	 *  "skip_access" => Defaults to false. If true, skips the access checks and just relates the stream to the category
	 * @param {&Streams_RelatedTo} $related_to
	 * @param {&Streams_RelatedFrom} $related_from
	 */
	private static function getRelation(
		$asUserId,
		$toPublisherId,
		$toStreamName,
		$type,
		$fromPublisherId,
		$fromStreamName,
		&$related_to,
		&$related_from,
		&$category,
		&$stream,
		$options = array())
	{
		// Function supports only single stream/category operation
		if (substr($toStreamName, -1) === '/' || substr($fromStreamName, -1) === '/')
			throw new Q_Exception("Cannot process relation on multiple streams");

		// Check access to category stream, the stream to which other streams are related
		$category = Streams::fetchOne($asUserId, $toPublisherId, $toStreamName);
		if (!$category) {
			throw new Q_Exception("Category not found", compact('toPublisherId', 'toStreamName'));
		}

		if (empty($options['skip_access'])) {
			if (!$category->testWriteLevel('relate')) {
				throw new Users_Exception_NotAuthorized();
			}
		}

		// Find member stream, the stream which is being related
		$stream = Streams::fetchOne($asUserId, $fromPublisherId, $fromStreamName);
		if (!$stream) {
			throw new Q_Exception("Stream $fromStreamName not found", array('fromStreamName', 'fromPublisherId'));
		}

		$related_to = new Streams_RelatedTo();
		$related_to->toPublisherId = $toPublisherId;
		$related_to->toStreamName = $toStreamName;
		$related_to->type = $type;
		$related_to->fromPublisherId = $fromPublisherId;
		$related_to->fromStreamName = $fromStreamName;

		$related_from = new Streams_RelatedFrom();
		$related_from->fromPublisherId = $fromPublisherId;
		$related_from->fromStreamName = $fromStreamName;
		$related_from->type = $type;
		$related_from->toPublisherId = $toPublisherId;
		$related_from->toStreamName = $toStreamName;
	}

	/**
	 * Make the stream a member of category or other aggregating stream,
	 * First parameter set - where to add, Second parameter set - what to add
	 * NOTE: this currently only works when fromPublisherId and toPublisherId are on same Q cluster
	 * @method relate
	 * @static
	 * @param {string} $asUserId
	 *  The user who is making aggreagtor operation on the stream (add stream to category)
	 * @param {string} $toPublisherId
	 *  The user who has published the category stream
	 * @param {string} $toStreamName
	 *  The name of the category stream
	 * @param {string} $type
	 *  The type of the relation
	 * @param {string} $fromPublisherId
	 *  The user who has published the member stream
	 * @param {string} $fromStreamName
	 *  The name of the member stream
	 * @param {array} $options=array()
	 *  An array of options that can include:
	 *  "skip_access" => Defaults to false. If true, skips the access checks and just relates the stream to the category
	 *  "weight" => Pass a numeric value here, or something like "max+1" to make the weight 1 greater than the current MAX(weight)
	 * @return array|boolean
	 *  Returns false if the operation was canceled by a hook
	 *  Returns true if relation was already there
	 *  Otherwise returns array with keys "messageFrom" and "messageTo" and values of type Streams_Message
	 */
	static function relate(
		$asUserId,
		$toPublisherId,
		$toStreamName,
		$type,
		$fromPublisherId,
		$fromStreamName,
		$options = array())
	{
		self::getRelation(
			$asUserId,
			$toPublisherId,
			$toStreamName,
			$type,
			$fromPublisherId,
			$fromStreamName,
			$related_to,
			$related_from,
			$category,
			$stream,
			$options);

		$to_exists = $related_to->retrieve();
		$from_exists = $related_from->retrieve();

		// Recover from inconsistency:
		// if one exists but not the other, clean up and start over
		if (($to_exists && !$from_exists) || (!$to_exists && $from_exists)) {
			if ($to_exists) $related_to->remove();
			if ($from_exists) $related_from->remove();
			$to_exists = $from_exists = false;
		}

		if ($to_exists && $from_exists) {
			return true;
		}

		// Now, set up the relation.
		/**
		 * @event Streams/relate/$streamType {before}
		 * @param {string} 'related_to'
		 * @param {string} 'related_from'
		 * @param {string} 'asUserId'
		 * @return {false} To cancel further processing
		 */
		if (false === Q::event(
			"Streams/relate/{$stream->type}",
			compact('related_to', 'related_from', 'asUserId'),
			'before'
		)) {
			return false;
		}

		/*
		 * save 'Streams/relation' to $related_to.
		 * we consider category stream as 'remote' i.e. more error prone.
		 * If first save fails, 'Streams/related' saved
		 */

		$weight = isset($options['weight']) ? $options['weight'] : null;

		if (!isset($related_to->weight) and isset($weight)) {
			$parts = explode('+', "$weight");
			if (count($parts) > 1 and is_numeric($parts[1])) {
				$row = Streams_RelatedTo::select('MAX(weight)')
					->where(compact('toPublisherId', 'toStreamName', 'type'))
					->ignoreCache()
					->getSql("Q::log")
					->fetchAll(PDO::FETCH_COLUMN);
				$weight = reset($row);
				$weight += $parts[1];
			} else if (!is_numeric($weight)) {
				throw new Q_Exception_WrongValue(array('field' => 'weight', 'range' => 'a numeric value'), 'weight');
			}
			$related_to->weight = $weight;
			Q::log("WEIGHT BABY: ".$weight);
		}

		try {
			$related_to->save();
		} catch (Exception $e) {
			// posting 'Streams/relation' failed. Relation is inconsistent.
			// JUNK: this leaves junk in the database, but preserves consistency
			throw new Streams_Exception_Relation();
		}

		// Send Streams/relatedTo message to a stream
		// node server will be notified by Streams_Message::post
		$relatedTo_message = Streams_Message::post($asUserId, $toPublisherId, $toStreamName, array(
			'type' => 'Streams/relatedTo',
			'instructions' => Q::json_encode(compact('fromPublisherId', 'fromStreamName', 'type', 'weight'))
		), true);

		try {
			$related_from->save();
		} catch (Exception $e) {
			throw new Streams_Exception_Relation();
		}

		// Send Streams/relatedFrom message to a stream
		// node server will be notified by Streams_Message::post
		$relatedFrom_message = Streams_Message::post($asUserId, $fromPublisherId, $fromStreamName, array(
			'type' => 'Streams/relatedFrom',
			'instructions' => Q::json_encode(compact('toPublisherId', 'toStreamName', 'type', 'weight'))
		), true);

		/**
		 * @event Streams/relate/$streamType {after}
		 * @param {string} 'related_to'
		 * @param {string} 'related_from'
		 * @param {string} 'asUserId'
		 */
		Q::event(
			"Streams/relate/{$stream->type}",
			compact('related_to', 'related_from', 'asUserId'),
			'after'
		);

		return array('messageFrom' => $relatedFrom_message, 'messageTo' => $relatedTo_message);
	}

	/**
	 * Attempt to remove the stream from category or other aggregating stream,
	 * First parameter set - where to remove, Second parameter set - what to remove
	 * NOTE: this currently only works when fromPublisherId and toPublisherId are on same Q cluster
	 * @method unrelate
	 * @static
	 * @param {string} $asUserId
	 *  The user who is making aggreagtor operation on the stream (remove stream from category)
	 * @param {string} $toPublisherId
	 *  The user who has published the category stream
	 * @param {string} $toStreamName
	 *  The name of the category stream
	 * @param {string} $type
	 *  The type of the relation
	 * @param {string} $fromPublisherId
	 *  The user who has published the member stream
	 * @param {string} $fromStreamName
	 *  The name of the member stream
	 * @param {array} $options=array()
	 *  An array of options that can include:
	 *  "skip_access" => Defaults to false. If true, skips the access checks and just relates the stream to the category
	 * @return boolean
	 *  Whether the relation was removed
	 */
	static function unrelate(
		$asUserId,
		$toPublisherId,
		$toStreamName,
		$type,
		$fromPublisherId,
		$fromStreamName,
		$options = array())
	{
		self::getRelation(
			$asUserId,
			$toPublisherId,
			$toStreamName,
			$type,
			$fromPublisherId,
			$fromStreamName,
			$related_to,
			$related_from,
			$category,
			$stream,
			$options);

		$to = $related_to->retrieve();
		$from = $related_from->retrieve();

		if (!$to && !$from) {
			return false;
		}

		// Now, clean up the relation.
		/**
		 * @event Streams/unrelate/$streamType {before}
		 * @param {string} 'related_to'
		 * @param {string} 'related_from'
		 * @param {string} 'asUserId'
		 * @return {false} To cancel further processing
		 */
		if (Q::event(
			"Streams/unrelate/{$stream->type}",
			compact('related_to', 'related_from', 'asUserId'), 
			'before') === false
		) {
			return;
		}

		/*
		 * remove 'Streams/relation' from $related_to.
		 * we consider category stream as 'remote' i.e. more error prone.
		 */

		if ($to && $related_to->remove()) {
			// Send Streams/unrelatedTo message to a stream
			// node server will be notified by Streams_Message::post
			Streams_Message::post($asUserId, $toPublisherId, $toStreamName, array(
				'type' => 'Streams/unrelatedTo',
				'instructions' => Q::json_encode(compact('fromPublisherId', 'fromStreamName'))
			), true);
		}

		if ($from && $related_from->remove()) {
			// Send Streams/unrelatedFrom message to a stream
			// node server will be notified by Streams_Message::post
			Streams_Message::post($asUserId, $fromPublisherId, $fromStreamName, array(
				'type' => 'Streams/unrelatedFrom',
				'instructions' => Q::json_encode(compact('toPublisherId', 'toStreamName'))
			), true);
		}

		/**
		 * @event Streams/unrelste/$streamType {after}
		 * @param {string} 'related_to'
		 * @param {string} 'related_from'
		 * @param {string} 'asUserId'
		 */
		Q::event(
			"Streams/unrelate/{$stream->type}",
			compact('related_to', 'related_from', 'asUserId'), 
			'after'
		);

		return true;
	}

	/**
	 * Fetch all the streams which are related to, or from, a given stream.
	 * @method related
	 * @static
	 * @param {string} $asUserId
	 *  The user who is fetching
	 * @param {string} $publisherId
	 *  The publisher of the stream
	 * @param {string} $toStreamName
	 *  The name of the stream which is presumably related to/from other streams
	 * @param {mixed} $isCategory=true
	 *  If false, returns the categories that this stream is related to.
	 *  If true, returns all the streams this related to this category.
	 *  If a string, returns all the streams related to this category with names prefixed by this string.
	 * @param {array} $options=array()
	 *	'limit' =>  number of records to fetch
	 *	'offset' =>  offset to start
	 *  'min' => the minimum weight (inclusive) to filter by, if any
	 *  'max' => the maximum weight (inclusive) to filter by, if any
	 *  'orderBy' => defaults to false, which means order by descending weight. True means by ascending weight.
	 *  'type' =>  if specified, this filters the type of the relation
	 *  'prefix' => if specified, this filters by the prefix of the related streams
	 *	'where' =>  you can also specify any extra conditions here
	 *  'extra' => An array of any extra info to pass to Streams::fetch when fetching streams
	 *	'relationsOnly' =>  If true, returns only the relations to/from stream, doesn't fetch the streams.
	 *		Useful if publisher id of relation objects is not the same as provided by publisherId.
	 *  'streamsOnly' => If true, returns only the streams related to/from stream, doesn't return the relations.
	 *      Useful for shorthand in while( ) statements.
	 *  'streamFields' => If specified, fetches only the fields listed here for any streams
	 *  'skipFields' => Optional array of field names. If specified, skips these fields when fetching streams
	 * @return {array}
	 */
	static function related(
		$asUserId,
		$publisherId,
		$streamName,
		$isCategory = true,
		$options = array())
	{
		// Function supports only single stream/category operation
		if (!is_string($streamName) or substr($streamName, -1) === '/') {
			throw new Q_Exception("Cannot fetch relations to multiple streams");
		}
		if (is_array($isCategory)) {
			$options = $isCategory;
			$isCategory = true;
		}

		// Check access to stream
		$stream = Streams::fetchOne($asUserId, $publisherId, $streamName);
		if (!$stream) {
			throw new Q_Exception("Stream $streamName not found", array('streamName', 'name', 'publisherId'));
		}
		if (!$stream->testReadLevel('see')) {
			throw new Users_Exception_NotAuthorized();
		}

		if ($isCategory) {
			$query = Streams_RelatedTo::select('*')
			->where(array(
				'toPublisherId' => $publisherId,
				'toStreamName' => $streamName
			));
		} else {
			$query = Streams_RelatedFrom::select('*')
			->where(array(
				'fromPublisherId' => $publisherId,
				'fromStreamName' => $streamName
			));
		}
		if ($isCategory) {
			if (empty($options['orderBy'])) {
				$query = $query->orderBy('weight', false);
			} else if ($options['orderBy'] === true) {
				$query = $query->orderBy('weight', true);
			}
		}
		if (isset($options['prefix'])) {
			if (substr($options['prefix'], -1) !== '/') {
				throw new Q_Exception("prefix has to end in a slash", 'prefix');
			}
			$other_field = $isCategory ? 'fromStreamName' : 'toStreamName';
			$query = $query->where(array(
				$other_field => new Db_Range($options['prefix'], true, false, true)
			));
		}

		$offset = !empty($options['offset']) ? $options['offset'] : 0;
		$max_limit = Q_Config::expect('Streams', 'db', 'limits', 'stream');
		$limit = !empty($options['limit'])
			? $options['limit']
			: $max_limit;
		if ($limit > $max_limit) {
			throw new Q_Exception("limit is too large, must be <= $max_limit");
		}

		if (isset($limit)) $query = $query->limit($limit, $offset);
		if (isset($options['min'])) $query = $query->where(array('weight >=' => $options['min']));
		if (isset($options['max'])) $query = $query->where(array('weight <=' => $options['max']));
		if (isset($options['type'])) $query = $query->where(array('type' => $options['type']));
		if (isset($options['where'])) $query = $query->where($options['where']);

		$relations = $query->fetchDbRows(null, '', $isCategory ? 'fromStreamName' : 'toStreamName');

		if (!empty($options['relationsOnly'])) {
			return $relations;
		}
		if (empty($relations)) {
			return empty($options['streamsOnly'])
				? array($relations, array(), $stream)
				: array();
		}
		$fields = '*';
		if (isset($options['skipFields'])) {
			$skip_fields = is_array($options['skipFields'])
				? $options['skipFields']
				: explode(',', $options['skipFields']);
			$fields = implode(',', array_diff(Streams_Stream::fieldNames(), $skip_fields));
		} else if (isset($options['streamFields'])) {
			$fields = is_string($options['streamFields'])
				? $options['streamFields']
				: implode(',', $options['streamFields']);
		}
		$extra = isset($options['extra']) ? $options['extra'] : null;
		$streams = Streams::fetch($asUserId, $publisherId, array_keys($relations), $fields, $extra);
		foreach ($streams as $name => $s) {
			$s->weight = isset($relations[$name]) ? $relations[$name]->weight : null;
		}
		if (!empty($options['streamsOnly'])) {
			return $streams;
		}
		return array($relations, $streams, $stream);
	}
	
	/**
	 * Updates the weight on a relation
	 * @param {string} $toPublisherId
	 *  The publisher of the stream on the 'to' end of the reltion
	 * @param {string} $toStreamName
	 *  The name of the stream on the 'to' end of the reltion
	 * @param {string} $type
	 *  The type of the relation
	 * @param {string} $fromPublisherId
	 *  The publisher of the stream on the 'from' end of the reltion
	 * @param {string} $fromStreamName
	 *  The name of the stream on the 'from' end of the reltion
	 * @param {double} $weight
	 *  The new weight
	 * @param {double} $adjust_weights=null
	 *  The amount to move the other weights by, to make room for this one
	 * @param {array} $options=array()
	 *  An array of options that can include:
	 *  "skip_access" => Defaults to false. If true, skips the access checks and just updates the weight on the relation
	 * @return array|boolean
	 *  Returns false if the operation was canceled by a hook
	 *  Otherwise returns array with key "to" and value of type Streams_Message
	 */
	static function updateRelation(
		$asUserId,
		$toPublisherId,
		$toStreamName,
		$type,
		$fromPublisherId,
		$fromStreamName,
		$weight,
		$adjust_weights = null,
		$options = array())
	{
		self::getRelation(
			$asUserId,
			$toPublisherId,
			$toStreamName,
			$type,
			$fromPublisherId,
			$fromStreamName,
			$related_to,
			$related_from,
			$category,
			$stream,
			$options);
			
		if (!$related_to->retrieve()) {
			throw new Q_Exception_MissingRow(
				array('table' => 'relatedTo', 'criteria' => 'those fields'),
				array('publisherId', 'name', 'type', 'toPublisherId', 'to_name')
			);			
		}
		if (!$related_from->retrieve()) {
			throw new Q_Exception_MissingRow(
				array('table' => 'relatedFrom', 'criteria' => 'those fields'),
				array('publisherId', 'name', 'type', 'fromPublisherId', 'from_name')
			);			
		}
		
		/**
		 * @event Streams/updateRelation/$streamType {before}
		 * @param {string} 'related_to'
		 * @param {string} 'related_from'
		 * @param {string} 'asUserId'
		 * @param {double} 'weight'
		 * @param {double} 'previous_weight'
		 */
		$previous_weight = $related_to->weight;
		if (Q::event(
			"Streams/updateRelation/{$stream->type}",
			compact('related_to', 'related_from', 'asUserId', 'weight', 'previous_weight', 'adjust_by'), 
			'before') === false
		) {
			return false;
		}
		
		if (!empty($adjust_weights) and is_numeric($adjust_weights) and $weight !== $previous_weight) {
			$criteria = array(
				'toPublisherId' => $toPublisherId,
				'toStreamName' => $toStreamName,
				'type' => $type,
				'weight' => $weight < $previous_weight
					? new Db_Range($weight, true, true, $previous_weight)
					: new Db_Range($previous_weight, true, true, $weight)
			);
			$adjust_by = $weight < $previous_weight ? $adjust_weights : -$adjust_weights;
			Streams_RelatedTo::update()->set(array(
				'weight' => new Db_Expression("weight + " . $adjust_by)
			))->where($criteria)->execute();
		}
		
		// Send Stream/updatedRelateTo message to the category stream
		// node server will be notified by Streams_Message::post
		$message = Streams_Message::post($asUserId, $toPublisherId, $toStreamName, array(
			'type' => 'Stream/updatedRelateTo',
			'instructions' => Q::json_encode(compact('fromPublisherId', 'fromStreamName', 'weight', 'previous_weight', 'adjust_by'))
		), true);
		
		// TODO: We are not yet sending Streams/updatedRelateFrom message to the other stream
		// because we might be changing a lot of weights, and we'd have to message a lot of streams.
		// This is better done in the background using Node.js after selecting using $criteria
		// When we implement this, we can introduce weight again in the related_from table.
		
		/**
		 * @event Streams/updateRelation/$streamType {after}
		 * @param {string} 'related_to'
		 * @param {string} 'related_from'
		 * @param {string} 'asUserId'
		 * @param {double} 'weight'
		 * @param {double} 'previous_weight'
		 */
		Q::event(
			"Streams/updateRelation/{$stream->type}",
			compact('related_to', 'related_from', 'asUserId', 'weight', 'previous_weight', 'adjust_by'),
			'after'
		);
		
		return $message;
	}

	/**
	 * Retrieve the user's stream needed to post invite messages
	 * If stream does not exists - create it. May return null if save failed.
	 * @method getInvitedStream
	 * @static
	 * @param $asUserId {string}
	 *	The user id of inviting user
	 * @param $forUserId {string}
	 *	User id for which stream is created
	 * @return {Streams_Stream|null}
	 */
	static function getInvitedStream ($asUserId, $forUserId) {
		$invited = Streams::fetch($asUserId, $forUserId, 'Streams/invited');
		if (!empty($invited)) return $invited['Streams/invited'];
		$invited = new Streams_Stream();
		$invited->publisherId = $forUserId;
		$invited->name = 'Streams/invited';
		$invited->type = 'Streams/invited';
		$invited->title = 'Streams/invited';
		$invited->content = 'Post message here when user is invited to some stream';
		$invited->readLevel = Streams::$READ_LEVEL['none'];
		$invited->writeLevel = Streams::$WRITE_LEVEL['post']; // anyone can post messages
		$invited->adminLevel = Streams::$ADMIN_LEVEL['none'];
		$result = $invited->save(true);
		//Streams::calculateAccess($asUserId, $forUserId, array('Streams/invited' => $invited), false);
		return $result ? $invited : null;
	}

	/**
	 * Method is used to verify access rights and fetch stream specific data
	 * @method get
	 * @static
	 *
	 * @param {string} $asUserId
	 *  The user who is attempting to fetch streams
	 * @param {string|array} $publisherId
	 *  Optional. The publisher of the stream to fetch
	 * @param {string|array} $streamName
	 *  Optional. The name of the stream to fetch. May be generic name if last char is '/'
	 *   if array is provided fetches streams for each array member
	 * @param {array} $options=array()
	 *   Array of parameters including:<br/>
	 *    "search" => Experimental, Optional. A search term to look in 'title' and 'content'.
	 *      If provided, $streamName shall be not empty and contain generic name (type) of the
	 *      streams to search. Streams/search/$type 'before' and 'after' hooks are called to
	 *      adjust search result<br/>
	 *
	 *   Following options work only if $publisherId and $streamName are strings and 'Stream' table is not
	 *	 sharded:<br/>
	 *
	 *    "limit" => Optional. The number of streams to fetch<br/>
	 *    "offset" => Optional. The offset to start from<br/>
	 *    "orderBy" => Optional. The name(s) of the field(s) to order result<br/>
	 * @param {boolean} $single=false
	 * @return {array}
	 *  Array of resulting stream indexed by name
	 */

	static function get(
		$asUserId,
		$publisherId,
		$streamName,
		$options = array(),
		$single = false) // return array by default
	{
		$publishers = is_array($publisherId) ? $publisherId : array($publisherId);
		$names = is_array($streamName) ? $streamName : array($streamName);
		// set up extra query options
		$modifiers = array();
		// use of these options is useless if fetching in many tries
		if (is_string($publisherId) && is_string($streamName))
			foreach (array('limit', 'offset', 'orderBy') as $option)
				if (isset($options[$option])) $modifiers[$option] = $options[$option];

		$streams = array();
		if (!isset($options['search'])) {
			// simply fetch requested streams
			foreach ($publishers as $publisherId) {
				foreach($names as $name) {
					$bulk = Streams::fetch($asUserId, $publisherId, $name, '*', $modifiers);
					foreach ($bulk as $key => $s) {
						if (!$s->testReadLevel('see')) {
							unset($bulk[$key]);
						} else {
							if (!$s->testReadLevel('content')) {
							foreach(array_diff(array_keys($s->fields), // even if stream is extended with non-standard fields they'll be removed
									array(	// the array of fields allowed to see
										'publisherId',
										'insertedTime',
										'updatedTime',
										'name',
										'type',
										'title',
										'icon',
										'messageCount',
										'participantCount')) as $field)
								unset($s->$field);
							}
						}
					}
					$streams = array_merge($streams, $bulk);
				}
			}
		} else {
			// try to search according to search term
			$search = $options['search'];
			// WARNING: we should use a separate solution for searches!!
			$modifiers['orWhere'] = "title LIKE %$search% OR content LIKE %$search%";
			foreach ($publishers as $publisherId) {
				foreach ($names as $name) {
					// we skip silently before/after hooks if $name is not generic
					if (substr($name, -1) === '/') {
						$type = substr($name, 0, -1);
						/**
						 * @event Streams/search/$streamType {before}
						 * @param {string} 'publisherId'
						 * @param {string} 'name'
						 * @return {false} To cancel further processing
						 */
						if (Q::event(
								"Streams/search/$type",
								compact('publisherId', 'name'),
								'before',
								false,
								$modifiers
							) === false) continue;

						$result = Streams::fetch($asUserId, $publisherId, $name, '*', $modifiers);

						/**
						 * @event Streams/search/$streamType {after}
						 * @param {string} 'publisherId'
						 * @param {string} 'name'
						 */
						Q::event(
								"Streams/search/$type",
								compact('publisherId', 'name', 'modifiers'),
								'after',
								false,
								$result
							);

						array_merge($streams, $result);
					}
				}
			}
		}

		return $single ? reset($streams) : $streams;
	}

	/**
	 * Get first and last name out of full name
	 * @method splitFullName
	 * @static
	 * @param {string} $fullname The string representing full name
	 * @return {array} array containing 'first' and 'last' properties
	 */
	static function splitFullName ($fullname) {
		$capitalize = Q_Config::get('Streams', 'inputs', 'fullname', 'capitalize', true);
		$last = null;
		if (strpos($fullname, ',') !== false) {
			list($last, $first) = explode(',', $fullname);
		} else if (strpos($fullname, ' ') !== false) {
			$parts = explode(' ', $fullname);
			if ($capitalize) {
				foreach ($parts as $k => $v) {
					$parts[$k] = ucfirst($v);
				}
			}
			$last = count($parts) > 1 ? array_pop($parts) : '';
			$first = join(' ', $parts);
		} else $first = $fullname;
		$first = trim($first);
		$last = trim($last);

		return compact('first', 'last');
	}

	/**
	 * Registers a user. Can be hooked to 'Users/register' before event
	 * so it can override standard functionality.
	 * Method ensures user registration based on full name and also handles registration of
	 * invited user
	 * @method register
	 * @static
	 * @param {string} $fullname The full name of the user in the format 'First Last' or 'Last, First'
	 * @param {string} $identifier User identifier
	 * @param {array} $icon=array() User icon
	 * @param {string} $provider=null Provider
	 * @param {array} $options=array() An array of options that could include:
	 *  "activation": The key under "Users"/"transactional" config to use for sending an activation message.
	 * @return {Users_User}
	 * @throws {Q_Exception_WrongType}
	 * 	If identifier is not e-mail or modile
	 * @throws {Q_Exception}
	 *	If user was already verified for someone else
	 * @throws {Users_Exception_AlreadyVerified}
	 * 	If user was already verified
	 * @throws {Users_Exception_UsernameExists}
	 *	If username exists
	 */
	static function register($fullname, $identifier, $icon = array(), $provider = null, $options = array())
	{
		if (is_array($provider)) {
			$options = $provider;
			$provider = null;
		}
		
		/**
		 * @event Users/register {before}
		 * @param {string} 'username'
		 * @param {string} 'identifier'
		 * @param {string} 'icon'
		 * @return {Users_User}
		 */
		$return = Q::event('Streams/register', compact('name', 'fullname', 'identifier', 'icon', 'provider', 'options'), 'before');
		if (isset($return)) {
			return $return;
		}

		// calculate first and last name out of name
		if (empty($fullname)) {
			throw new Q_Exception("Please enter your name", 'name');
		}

		$name = self::splitFullName($fullname);
		extract($name);

		if (empty($first) && empty($last)) {
			// this is unlikely to happen
			throw new Q_Exception("Please enter your name properly", 'name');
		}

		self::$cache['register'] = $name;

		if ($provider !== 'invite') {
			$user = Users::register("", $identifier, $icon, $provider, $options);
		} else {
			if (!empty($identifier)) {
				$rid = Users::requestedIdentifier($type);
				$user = Users::userFromContactInfo($type, $rid);
				if (!$user) throw new Users_Exception_NoSuchUser();
			} else {
				$user = Users::loggedInUser();
			}
		}

		if (!empty($first)) {
			$stream = new Streams_Stream();
			$stream->publisherId = $user->id;
			$stream->name = 'Streams/user/firstName';
			$stream->retrieve();
			$stream->type = 'Streams/text/small';
			$stream->title = 'First Name';
			$stream->content = $first;
			$stream->save(true);
		}
		if (!empty($last)) {
			$stream = new Streams_Stream();
			$stream->publisherId = $user->id;
			$stream->name = 'Streams/user/lastName';
			$stream->retrieve();
			$stream->type = 'Streams/text/small';
			$stream->title = 'Last Name';
			$stream->content = $last;
			$stream->save(true);
		}

		/**
		 * @event Users/register {after}
		 * @param {string} 'username'
		 * @param {string} 'identifier'
		 * @param {string} 'icon'
		 * @param {Users_User} 'user'
		 * @return {Users_User}
		 */
		Q::event('Streams/register', compact('name', 'identifier', 'icon', 'user', 'provider', 'options'), 'after');

		return $user;
	}
	
	/**
	 * A convenience method to get the URL of the streams-related action
	 * @method register
	 * @static
	 * @param {string} $publisherId
	 *	The name of the publisher
	 * @param {string} $streamName
	 *	The name of the stream
	 * @param {string} $what
	 *	Defaults to 'stream'. Can also be 'message', 'relation', etc.
	 * @return {string} 
	 *	The corresponding URL
	 */
	static function actionUrl($publisherId, $streamName, $what = 'stream')
	{
		switch ($what) {
			case 'stream':
			case 'message':
			case 'relation':
				return Q_Uri::url("Streams/$what?publisherId=".urlencode($publisherId)."&name=".urlencode($streamName));
		}
		return null;
	}

	/**
	 * @property $fetch
	 * @static
	 * @type array
	 * @protected
	 */
	protected static $fetch = array();
	/**
	 * @property $users
	 * @static
	 * @type array
	 * @protected
	 */
	protected static $users = array();
	/**
	 * @property $cache
	 * @static
	 * @type array
	 */
	static $cache = array();
	/**
	 * @property $followedInvite
	 * @type Streams_Invite
	 */
	static $followedInvite = null;
	/**
	 * @property $requestedPublisherId_override
	 * @static
	 * @type string
	 */
	static $requestedPublisherId_override = null;
	/**
	 * @property $requestedName_override
	 * @static
	 * @type string
	 */
	static $requestedName_override = null;

};
