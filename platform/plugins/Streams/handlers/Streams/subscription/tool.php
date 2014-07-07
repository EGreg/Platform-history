<?php

/**
 * Subscription tool
 * @param array $options
 *  "publisherId" => the id of the user who is publishing the stream
 *  "streamName" => the name of the stream for which to edit access levels
 */
function Streams_subscription_tool($options) {
	extract($options);

	$user = Users::loggedInUser(true);

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
	$stream->subscribe();
	$stream->leave();
	$subscribed  = $participant->subscribed;

	/*
	* TODO - resolve this
	*/
	$types = Q_Config::get('Streams', 'types', $stream->type, 'messages', null);
	if (!$types) {
		throw new Q_Exception_NoSubscriptions(array(
			'type' => $stream->type
		));
	}
	$messageTypes = array();
	foreach($types as $type => $msg) {
		$messageTypes[] = array(
			'value' => $type,
			'name'  => Q::ifset($msg, 'title', $type)
		);
	}

	$usersFetch = array(
		'userId' => $user->id,
		'state'  => 'active'
	);

	$devices = array();
	$emails  = Users_Email::select('address')
		->where($usersFetch)
		->fetchAll(PDO::FETCH_COLUMN);
	$mobiles = Users_Mobile::select('number')
		->where($usersFetch)
		->fetchAll(PDO::FETCH_COLUMN);
	if (!$emails and !$mobiles) {
		throw new Users_Exception_NotVerified(array(
			'type' => 'account'
		));
	}

	foreach ($emails as $email) {
		$devices[] = array( 
			'value' => json_encode(compact('email')), 
			'name' => 'my email' 
		);
	}

	foreach ($mobiles as $mobile) {
		$devices[] = array(
			'value' => json_encode(compact('mobile')),
			'name' => 'my mobile'
		);
	}

	$device = array();
	$filter = array();

	$rule 			   = new Streams_Rule();
	$rule->streamName  = $streamName;
	$rule->publisherId = $publisherId;
	$rule->ofUserId    = $user->id;
	if ($rule->retrieve()) {
		$device = json_decode($rule->deliver);
		$filter = json_decode($rule->filter);
	}

	Q_Response::addScript("plugins/Streams/js/Streams.js");
	Q_Response::addScript("plugins/Streams/js/tools/subscription.js");

	Q_Response::setToolOptions(compact(
		'device',
		'filter',
		'subscribed',
		'messageTypes',
		'devices',
		'publisherId',
		'streamName'
	));
}