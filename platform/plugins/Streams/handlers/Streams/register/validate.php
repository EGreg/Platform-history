<?php

function Streams_register_validate()
{
	Q_Valid::nonce(true);

	$fields = Users::loggedInUser() ? array('fullname') : array('identifier', 'fullname', 'icon');

	foreach ($fields as $field) {
		if (!isset($_REQUEST[$field])) {
			throw new Q_Exception("$field is missing", array($field));
		}
	}
	
	$length_min = Q_Config::get('Streams', 'inputs', 'fullname', 'lengthMin', 5);
	$length_max = Q_Config::get('Streams', 'inputs', 'fullname', 'lengthMax', 30);
	if (strlen($_REQUEST['fullname']) < $length_min) {
		throw new Q_Exception("Your full name can't be that short.", 'fullname');
	}
	if (strlen($_REQUEST['fullname']) > $length_max) {
		throw new Q_Exception("Your full name can't be that long.", 'fullname');
	}
}
