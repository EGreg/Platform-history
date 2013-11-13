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
		if (!$stream->testWriteLevel('close')) throw new Users_Exception_NotAuthorized();
	}

	// Clean up relations
	list($relations, $related) = Streams::related($user->id, $stream->publisherId, $stream->name, true);
	foreach ($related as $r) {
		try {
			Streams::unrelate($user->id, $r->publisherId, $r->name, $r->type, $stream->publisherId, $stream->name);
		} catch (Exception $e) {}
	}

	if (Streams::$cache['result'] = !!$stream->remove()) {
		// clean up access records
		Streams_Access::delete()->where(array(
			'publisherId' => $stream->publisherId,
			'streamName' => $stream->name
		))->execute();
	}
	
	Q_Response::setSlot('result', Streams::$cache['result']);
}