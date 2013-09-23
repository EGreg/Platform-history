<?php

/**
 * Used to create a new stream
 *
 * @param array $_REQUEST
 *   toPublisherId, toStreamName, type, fromPublisherId, fromStreamName
 *   weight, adjust_weights
 * @return void
 */
function Streams_related_put($params) {
	$user = Users::loggedInUser(true);
	$userId = $user ? $user->id : '';
	$toPublisherId = $_REQUEST['toPublisherId'];
	$toStreamName = $_REQUEST['toStreamName'];
	$type = $_REQUEST['type'];
	$fromPublisherId = $_REQUEST['fromPublisherId'];
	$fromStreamName = $_REQUEST['fromStreamName'];
	$weight = $_REQUEST['weight'];
	$adjust_weights = isset($_REQUEST['adjust_weights']) ? $_REQUEST['adjust_weights'] : null;

	$result = Streams::updateRelation(
		$userId, 
		$toPublisherId, 
		$toStreamName, 
		$type,
		$fromPublisherId, 
		$fromStreamName,
		$weight, 
		$adjust_weights
	);

	Q_Response::setSlot('result', $result);
}
