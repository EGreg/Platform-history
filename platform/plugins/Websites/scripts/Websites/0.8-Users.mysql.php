<?php

function Websites_0_8_Users_mysql()
{
	$userId = Q_Config::get("Websites", "user", "id", null);
	if (!$userId) {
		throw new Q_Exception('Websites: Please fill in the config field "Websites"/"user"/"id"');
	}
	
	Users_Label::addLabel('Websites/admins', $userId, 'Website Admins');
}

Websites_0_8_Users_mysql();