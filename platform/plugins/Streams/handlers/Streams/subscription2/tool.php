<?php

function Streams_subscription2_tool($options) {
	extract($options);

	$user = Users::loggedInUser();
	if (!$user) {
		throw new Users_Exception_NotLoggedIn();
	}

	if (!isset($publisherId)) {
		$publisherId = Streams::requestedPublisherId(true);
	}

	if (!isset($streamName)) {
		$streamName = Streams::requestedName();
	}

	$stream = Streams::fetchOne($user->id, $publisherId, $streamName);
	if (!$stream) {
		throw new Q_Exception_MissingRow(array(
			'table'    => 'stream',
			'criteria' => compact('publisherId', 'streamName')
		));
	}

	// if user is not participant, join the stream
	$participant = $stream->join();

	/*
	* TODO - resolve this
	*/
	$types = Q_Config::get('Streams', 'types', 'types');
	$types = $types[$stream->type]['messages'];
	if (count($types) === 0) {
		throw new Q_Exception("Stream of type '{$stream->type}' does not support subscription");
	}

	$messageTypes = array();
	foreach($types as $type => $msg) {
		$messageTypes[] = array( 'value' => $type, 'name'  => $type );
	}

	$usersFetch = array(
		'userId' => $user->id,
		'state'  => 'active'
	);

	$devices = array();
	$emails  = Users_Email::select('address')->where($usersFetch)->fetchAll(PDO::FETCH_COLUMN);
	$mobiles = Users_Mobile::select('number')->where($usersFetch)->fetchAll(PDO::FETCH_COLUMN);
	if (count($emails) == 0 and count($mobiles) == 0) {
		throw new Users_Exception_NotVerified('Your account not verificated');
	}

	foreach ($emails as $email) {
		$devices[] = array( 'value' => '{"email":"'.$email.'"}', 'name' => 'my email' );
	}

	foreach ($mobiles as $mobile) {
		$devices[] = array( 'value' => '{"mobile":"'.$mobile.'"}', 'name' => 'my mobile' );
	}


	/*
	* User not activated self account
	*/
	if (count($emails) == 0 and count($mobiles) == 0) {
		throw new Users_Exception_NotVerified('Your account not verificated');
	}

	Q_Response::setToolOptions(compact('participant', 'messageTypes', 'devices', 'publisherId', 'streamName'));
	Q_Response::addScript("plugins/Streams/js/tools/subscription2.js");
}