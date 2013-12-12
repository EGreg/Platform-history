<?php

function Invites_welcome_response() {
	$token = Q_Dispatcher::uri()->token;
	if (empty($token)) {
		// token missing
		Q_Response::setSlot('content', Q::view('Invites/tokenError.php', array('message' => 'Missing token')));
		return;
	}
	// $token
	$invite = Streams_Invite::fromToken($token);
	if (empty($invite)) {
		// invite missing
		Q_Response::setSlot('content', Q::view('Invites/tokenError.php', array('message' => 'Missing invite')));
		return;
	}
	$user = Users_User::getUser($invite->userId, true);
	
	// ensure user is verified
	setVerified($user);

	Q_Response::redirect($invite->appUrl."?".http_build_query(array('Q.Streams.token' => $token), null, '&'));
}

function setVerified($user)
{
	$identifier = null;
	if ($user->signedUpWith === 'none') {
		if (empty($user->emailAddressPending)) {
			$identifier = $user->mobileNumberPending;
			$user->mobileNumberPending = '';
			$user->signedUpWith = 'mobile';
		} else {
			$identifier = $user->emailAddressPending;
			$user->emailAddressPending = '';
			$user->signedUpWith = 'email';
		}
	}
	if (empty($identifier)) return;
	if (Q_Valid::email($identifier, $emailAddress)) {
		$user->setEmailAddress($emailAddress, true);
	} else if (Q_Valid::phone($identifier, $mobileNumber)) {
		$user->setMobileNumber($mobileNumber, true);
	} else {
		throw new Q_Exception_WrongType(array(
			'field' => 'identifier',
			'type' => 'email address or mobile number'
		), array('emailAddress', 'mobileNumber'));
	}
	// Import the user's icon and save it
	if (empty($user->icon) || substr($user->icon, 0, 7) === 'default' || substr($user->icon, 0, 6) === 'future') {
		$hash = md5(strtolower(trim($identifier)));
		$icon = array(
			'40.png' => array('hash' => $hash, 'size' => 40),
			'50.png' => array('hash' => $hash, 'size' => 50),
			'80w.png' => array('hash' => $hash, 'size' => 80)
		);
		$user->icon = Users::downloadIcon($user, $icon);
	}
}