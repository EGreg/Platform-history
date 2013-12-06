<?php

/**
 * Used to delete EXISITNG stream
 *
 * @param string $params 
 *   publisher id and stream name of existing stream shall be supplied
 * @return void
 */

function Streams_stream_delete() {
	// only logged in user can delete the stream
	$user = Users::loggedInUser(true);
	
	$publisherId = Streams::requestedPublisherId(true);
	$name = Streams::requestedName(true);
	
	$stream = new Streams_Stream();
	$stream->publisherId = $publisherId;
	$stream->name = $name;
	if (!$stream->retrieve()) {
		throw new Q_Exception_MissingRow(array(
			'table' => 'stream', 
			'criteria' => "{publisherId: '$publisherId', name: '$streamName'}"
		));
	}
	// Authorization check
	if ($user->id !== $publisherId) {
		$stream->calculateAccess($user->id);
		if (!$stream->testWriteLevel('close')) {
			throw new Users_Exception_NotAuthorized();
		}
	}

	// Clean up relations from other streams to this category
	list($relations, $related) = Streams::related($user->id, $stream->publisherId, $stream->name, true);
	foreach ($relations as $r) {
		try {
			Streams::unrelate($user->id, $r->fromPublisherId, $r->fromStreamName, $r->type, $stream->publisherId, $stream->name);
		} catch (Exception $e) {}
	}

	// Clean up relations from this stream to categories
	list($relations, $related) = Streams::related($user->id, $stream->publisherId, $stream->name, false);
	foreach ($relations as $r) {
		try {
			Streams::unrelate($user->id, $r->toPublisherId, $r->toStreamName, $r->type, $stream->publisherId, $stream->name);
		} catch (Exception $e) {}
	}

	Streams::$cache['result'] = false;
	try {
		$stream->closedTime = new Db_Expression("CURRENT_TIMESTAMP");
		if ($stream->save()) {
			$stream->post($user->id, array(
				'type' => 'Streams/closed',
				'content' => ''
			), true);
			Streams::$cache['result'] = true;
		}
	} catch (Exception$e) {
		
	}
	
	// NOTE: we did not delete the stream. That will have to be done in a cron job like this:
	// // Clean up access
	// $stream->delete();
	// Streams_Access::delete()->where(array(
	// 	'publisherId' => $stream->publisherId,
	// 	'streamName' => $stream->name
	// ))->execute();
	
	Q_Response::setSlot('result', Streams::$cache['result']);
}