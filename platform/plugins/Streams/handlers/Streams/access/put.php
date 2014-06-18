<?php

function Streams_access_put($params)
{
	$user = Users::loggedInUser(true);
	
	Q_Valid::nonce(true);
	
	$stream = new Streams_Stream();
	$stream->publisherId = Streams::requestedPublisherId(true);
	$stream->name = Streams::requestedName(true);
	if (!$stream->retrieve()) {
		throw new Q_Exception_MissingRow(array('table' => 'stream', 'criteria' => 'that name'));
	}
	if (!$stream->testAdminLevel('own')) {
		throw new Users_Exception_NotAuthorized();
	}
	
	$p = array_merge($_REQUEST, $params);
	$access = new Streams_Access();
	$access->publisherId = $stream->publisherId;
	$access->streamName = $stream->name;
	$access->ofUserId = Q::ifset($_REQUEST, 'ofUserId', '');
	$access->ofContactLabel = Q::ifset($_REQUEST, 'ofContactLabel', '');
	$access->retrieve();
	if (empty($access->ofUserId) and empty($access->ofContactLabel)) {
		throw new Q_Exception("Specify a user id or contact label", array('ofUserId', 'ofContactLabel'));
	}
	
	$fields = array(
		'grantedByUserId', 'filter',
		'readLevel', 'writeLevel', 'adminLevel',
	);
	foreach ($fields as $field) {
		if (isset($p[$field])) {
			$access->$field = $p[$field];
		}
	}
	$defaults = array(
		'grantedByUserId' => $user->id,
		'readLevel' => -1,
		'writeLevel' => -1,
		'adminLevel' => -1
	);
	foreach ($defaults as $k => $v) {
		if (!isset($access->$k)) {
			$access->$k = $v;
		}
	}
	$access->save();
	Streams::$cache['access'] = $access;
}