<?php

function Users_login_post()
{
	$passphrase = $_REQUEST['passphrase'];
	if (empty($passphrase)) {
		throw new Q_Exception("Please enter your pass phrase", 'passphrase');
	}
	$identifier = Users::requestedIdentifier();
	$user = Users::login($identifier, $passphrase);
	Users::$cache['user'] = $user;
}