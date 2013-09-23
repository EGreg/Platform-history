<?php

function Streams_user_response_data($params)
{
	$identifier = Users::requestedIdentifier($type);
	$hash = md5(strtolower(trim($identifier)));

	// check our db
	if ($user = Users::userFromContactInfo($type, $identifier)) {
		$displayname = Streams::displayName($user);
		$verified = !!Users::identify($type, $identifier);
		return array(
			'exists' => true,
			'verified' => $verified,
			'username' => $user->username,
			'displayName' => $displayname,
			'icon' => $verified ? Q_Request::baseUrl()."/action.php/Q/image?hash=$hash&size=80&type=".Q_Config::get('Users', 'login', 'iconType', 'wavatar') : $user->icon,
			'passphrase_set' => !empty($user->passphraseHash),
			'fb_uid' => $user->fb_uid ? $user->fb_uid : null
		);
	}
	if ($type === 'email') {
		$email = new Users_Email();
		Q_Valid::email($identifier, $normalized);
		$email->address = $normalized;
		$exists = $email->retrieve();
	} else if ($type === 'mobile') {
		$mobile = new Users_Mobile();
		Q_Valid::phone($identifier, $normalized);
		$mobile->number = $normalized;
		$exists = $mobile->retrieve();
	}
	
	if (empty($exists) and Q_Config::get('Users', 'login', 'noRegister', false)) {
		$nicetype = ($type === 'email') ? 'email address' : 'mobile number';
		throw new Q_Exception("This $nicetype was not registered", array('identifier'));
	}

	$result = array(
		"entry" => array(
			"thumbnailUrl" => Q_Request::baseUrl()."/action.php/Q/image?hash=$hash&size=80&type=".Q_Config::get('Users', 'login', 'iconType', 'wavatar')
		)
	);
	if ($type === 'email') {
		$result['emailExists'] = !empty($exists);
	} else {
		$result['mobileExists'] = !empty($exists);
	}
	if ($terms_label = Users::termsLabel('register')) {
		$result['termsLabel'] = $terms_label;
	}
	return $result;
}
