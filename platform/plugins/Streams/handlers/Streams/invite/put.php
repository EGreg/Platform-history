<?php

function Streams_invite_put () {

	$invite = Streams_Invite::fromToken(Streams::requestedField('token', true));
	if (!$invite) {
		throw new Q_Exception_MissingRow(array(
			'table' => 'invite',
			'criteria' => 'token = "' . $_REQUEST['token'] . '"'
		));
	}

	if (isset($_REQUEST['fullName'])) {
		$user = Streams::register($_REQUEST['fullName'], null, array(), 'invite');
		Users::setLoggedInUser($user);
	}

	Q_Response::redirect($invite->appUrl."?".http_build_query(array(
		'publisherId' => $invite->publisherId,
		'streamName' => $invite->streamName
	), null, '&').'&'.$_SERVER['QUERY_STRING']);
}