<?php

function Websites_0_8_Users_mysql()
{
	$userId = Q_Config::get("Websites", "user", "id", null);
	if (!$userId) {
		throw new Q_Exception('Websites: Please fill in the config field "Websites"/"user"/"id"');
	}
	
	Users_Label::addLabel('Websites/admins', $userId, 'Website Admins', 'labels/Websites/admins');
	
	if (!file_exists('Websites')) {
		Q_Utils::symlink(
			WEBSITES_PLUGIN_FILES_DIR.DS.'Websites'.DS.'icons'.DS.'labels'.DS.'Websites',
			USERS_PLUGIN_FILES_DIR.DS.'Users'.DS.'icons'.DS.'Websites'
		);
	}
}

Websites_0_8_Users_mysql();