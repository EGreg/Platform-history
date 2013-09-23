<?php

function Streams_invite_response_data () {
	if (isset(Streams::$cache['invited'])) return Streams::$cache['invited'];

	$user = Users::loggedInUser(true);

	$publisherId = Streams::requestedPublisherId();
	$streamType = Streams::requestedType();
	$invitingUserId = Streams::requestedField('invitingUserId');

	$invites = Streams_Invite::select('*')->where(array(
		'userId' => $user->id,
		'state' => 'pending'
	))->where(new Db_Expression('expireTime < CURRENT_TIMESTAMP'));

	if (isset($publisherId)) $invites = $invites->where(array('publisherId' => $publisherId));
	if (isset($streamType)) $invites = $invites->where(array('streamName' => new Db_Range($streamType.'/', true, false, true)));
	if (isset($invitingUserId)) $invites = $invites->where(array('invitingUserId' => $invitingUserId));

	$invites = $invites->fetchDbRows();

	$streams = array();

	foreach ($invites as $invite) {
		$stream = new Streams_Stream();
		$stream->publisherId = $invite->publisherId;
		$stream->name = $invite->streamName;
		if ($stream->retrieve()) {
			$streams[$invite->token] = $stream->exportArray();
			$streams[$invite->token]['displayName'] = $invite->displayName;
		}
	}
	return $streams;
}