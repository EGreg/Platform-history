<?php

function Streams_before_Q_objects()
{
	$token = Q_Request::special('Streams.token', null);
	if ($token === null) return;

	$invite = Streams_Invite::fromToken($token);
	if (!$invite) {
		throw new Q_Exception_MissingRow(array(
			'table' => 'invite',
			'criteria' => "token = '$token"
		), 'token');
	}
	
	// did invite expire?
	$ts = Streams_Invite::db()->select("CURRENT_TIMESTAMP")->fetchAll(PDO::FETCH_NUM);
	if (isset($invite->expireTime)
	and $invite->expireTime < $ts[0][0]) {
		$invite->state = 'expired';
		$invite->save();
	}
	
	// is invite still pending?
	if ($invite->state !== 'pending') {
		switch ($invite->state) {
		case 'expired':
			$exception = new Streams_Exception_AlreadyExpired(null, 'token');
			break;
		case 'accepted':
			$exception = new Streams_Exception_AlreadyAccepted(null, 'token');
			break;
		case 'declined':
			$exception = new Streams_Exception_AlreadyDeclined(null, 'token');
			break;
		case 'forwarded':
			$exception = new Streams_Exception_AlreadyForwarded(null, 'token');
			break;
		default:
			$exception = new Q_Exception("This invite has already been " . $invite->state, 'token');
			break;
		}
		$shouldThrow = Q::event('Streams/objects/inviteException', compact('invite', 'exception'), 'before');
		if ($shouldThrow === null) {
			Q_Response::setNotice('Streams/objects', $exception->getMessage(), true);
		} else if ($shouldThrow === true) {
			throw $exception;
		}
	}
	
	// now process the invite
	$userId = Users_User::getUser($invite->userId, true);
	$stream = new Streams_Stream();
	$stream->publisherId = $invite->publisherId;
	$stream->name = $invite->streamName;
	if (!$stream->retrieve()) {
		throw new Q_Exception_MissingRow(array(
			'table' => 'stream',
			'criteria' => "publisherId = '{$invite->publisherId}', name = '{$invite->streamName}'"
		));
	}
	$stream->calculateAccess($userId);
	
	$byUserId = Users_User::getUser($invite->invitingUserId, true);
	$by_stream = new Streams_Stream();
	$by_stream->publisherId = $invite->publisherId;
	$by_stream->name = $invite->streamName;
	if (!$by_stream->retrieve()) {
		throw new Q_Exception_MissingRow(array(
			'table' => 'stream',
			'criteria' => "publisherId = '{$invite->publisherId}', name = '{$invite->streamName}'"
		));
	}
	$by_stream->calculateAccess($byUserId);
	
	$access = new Streams_Access();
	$access->publisherId = $by_stream->publisherId;
	$access->streamName = $by_stream->name;
	$access->ofUserId = $invite->userId;

	$specified_access = false;
	foreach (array('readLevel', 'writeLevel', 'adminLevel') as $level_type) {
		$access->$level_type = -1;
		if (empty($invite->$level_type)) {
			continue;
		}
		// Give access level from the invite.
		// However, if inviting user has a lower access level now,
		// then give that level instead, unless it is lower than
		// what the invited user would have had otherwise.
		$min = min($invite->$level_type, $by_stream->get($level_type, 0));
		if ($min > $stream->get($level_type, 0)) {
			$access->$level_type = $min;
			$specified_access = true;
		}
	}
	if ($specified_access) {
		$access->save(true);
	}
	
	// now log invited user in
	$user = Users::loggedInUser();
	if (empty($user) or $user->id !== $invite->userId) {
		$user = new Users_User();
		$user->id = $invite->userId;
		if (!$user->retrieve()) {
			// The user who was invited doesn't exist
			// This shouldn't happen. We just silently log it and return.
			Q::log("Sanity check failed: invite with {$invite->token} pointed to nonexistent user");
			return;
		}
		Users::setLoggedInUser($user);
	}
	
	// accept invite
	$invite->accept();
	
	// set stream PK for further processing
	Streams::$followedInvite = $invite;
}
