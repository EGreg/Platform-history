<?php

function Streams_message_response_messages()
{
	if (isset(Streams::$cache['message'])) {
		$message = Streams::$cache['message'];
		return Db::exportArray(array($message->ordinal => $message));
	}
	if (isset(Streams::$cache['messages'])) {
		return Db::exportArray(Streams::$cache['messages']);
	}
	
	$publisherId = Streams::requestedPublisherId(true);
	$streamName = Streams::requestedName(true);
	$type = Streams::requestedMessageType();
	$limit = isset($_REQUEST['limit'])
		? $_REQUEST['limit']
		: Q_Config::get('Streams', 'defaults', 'messageRequestLimit', 100);
	if (isset($_REQUEST['ordinal'])) {
		$min = $_REQUEST['ordinal'];
		$limit = 1;
	}
	if (isset($_REQUEST['min'])) {
		$min = $_REQUEST['min'];
	}
	$max = isset($_REQUEST['max']) ? $_REQUEST['max'] : -1;
	if (isset($_REQUEST['ascending'])) {
		$ascending = $_REQUEST['ascending'];
	}

	$user = Users::loggedInUser();
	$userId = $user ? $user->id : "";
	$stream = isset(Streams::$cache['stream'])
		? Streams::$cache['stream']
		: Streams::fetchOne($userId, $publisherId, $streamName);
	if (!$stream) {
		throw new Q_Exception_MissingRow(array(
			'table' => 'Stream', 
			'criteria' => "{publisherId: '$publisherId', name: '$streamName'}"
		));
	}

	if (!$stream->testReadLevel('messages')) {
		throw new Users_Exception_NotAuthorized();
	}

	$messages = $stream->getMessages(compact('type', 'min', 'max', 'limit', 'ascending'));
	return Db::exportArray($messages);
}