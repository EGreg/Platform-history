<?php

/**
 * Used to create a new stream
 *
 * @param {array} $_REQUEST 
 * @param {String} [$_REQUEST.title] Required. The title of the interest.
 * @param {String} [$_REQUEST.publisherId] Optional. Defaults to the app name.
 * @param {String} [$_REQUEST.subscribe] Optional. Defauls to false. Whether to subscribe rather than just join the interest stream.
 * @return void
 */
function Streams_interest_delete()
{
	$user = Users::loggedInUser(true);
	$title = Q::ifset($_REQUEST, 'title', null);
	if (!isset($title)) {
		throw new Q_Exception_RequiredField(array('field' => 'title'));
	}
	$app = Q_Config::expect('Q', 'app');
	$publisherId = Q::ifset($_REQUEST, 'publisherId', $app);
	$name = 'Streams/interest/' . Q_Utils::normalize($title);
	$stream = Streams::fetchOne(null, $publisherId, $name);
	if (!$stream) {
		throw new Q_Exception_MissingRow(array(
			'table' => 'stream', 
			'criteria' => Q::json_encode(compact('publisherId', 'name'))
		));
	}
	$miPublisherId = $user->id;
	$miName = 'Streams/user/interests';
	$myInterests = Streams::fetchOne($user->id, $miPublisherId, $miName);
	if (!$myInterests) {
		throw new Q_Exception_MissingRow(array(
			'table' => 'stream', 
			'criteria' => Q::json_encode(array(
				'publisherId' => $miPublisherId,
				'name' => $miName
			))
		));
	}
	$stream->leave();
	
	Streams::unrelate(
		$user->id,
		$user->id,
		'Streams/user/interests',
		'Streams/interest',
		$publisherId,
		$name,
		array('adjustWeights' => true)
	);
}