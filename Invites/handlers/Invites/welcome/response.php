<?php

function Invites_welcome_response() {
	$token = Q_Dispatcher::uri()->token;
	if (!$token) {
		Q_Response::setSlot('content', Q::view('Invites/tokenError.php', array('message' => 'Missing token')));
		return;
	}
	$invite = Streams_Invite::fromToken($token);
	if (!$invite) {
		Q_Response::setSlot('content', Q::view('Invites/tokenError.php', array('message' => 'Missing invite')));
		return;
	}
	Users_User::getUser($invite->userId, true)
		->setVerified();
	Q_Response::redirect($invite->appUrl."?".http_build_query(array('Q.Streams.token' => $token), null, '&'));
}