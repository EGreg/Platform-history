<?php

/**
 * Used to create a new relation
 *
 * @param array $_REQUEST 
 *   publisherId, streamName, type
 *   relate_name, relate_type, relate_weight
 * @return void
 */

function Streams_related_post($params) {
	$user = Users::loggedInUser(true);
	$asUserId = $user->id;
	$toPublisherId = $_REQUEST['toPublisherId'];
	$toStreamName = $_REQUEST['toStreamName'];
	$type = $_REQUEST['type'];
	$fromPublisherId = $_REQUEST['fromPublisherId'];
	$fromStreamName = $_REQUEST['fromStreamName'];
	if (isset($_REQUEST['weight'])) {
		$weight = $_REQUEST['weight'];
	}
	
	// TODO: When we start supporting multiple hosts, this will have to be rewritten
	// to make servers communicate with one another when establishing relations between streams
	
	if (!($stream = Streams::fetch($asUserId, $toPublisherId, $toStreamName))) {
		throw new Q_Exception_MissingRow(
			array('table' => 'stream', 'criteria' => 'those fields'), 
			array('publisherId', 'name')
		);
	}
	if (!($stream = Streams::fetch($asUserId, $fromPublisherId, $fromStreamName))) {
		throw new Q_Exception_MissingRow(
			array('table' => 'stream', 'criteria' => 'those fields'),
			array('fromPublisherId', 'from_name')
		);
	}

	$result = Streams::relate(
		$asUserId, 
		$toPublisherId, 
		$toStreamName, 
		$type, 
		$fromPublisherId, 
		$fromStreamName,
		compact('weight')
	);
	Q_Response::setSlot('result', $result);
}