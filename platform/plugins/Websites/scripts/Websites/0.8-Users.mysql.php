<?php

function Websites_0_8_Users_mysql()
{
	$userId = Q_Config::get("Websites", "user", "id", null);
	if (!$userId) {
		throw new Q_Exception('Websites: Please fill in the config field "Websites"/"user"/"id"');
	}
	
	Users_Label::addLabel('Websites/admins', $userId, 'Website Admins', 'labels/Websites/admins');
	
	$cwd = getcwd();
	chdir(USERS_PLUGIN_FILES_DIR.DS.'Users'.DS.'icons');
	if (!file_exists('Websites')) {
		$is_win = (substr(strtolower(PHP_OS), 0, 3) === 'win');
		$target = WEBSITES_PLUGIN_FILES_DIR.DS.'Websites'.DS.'icons'.DS.'labels'.DS.'Websites';
		$link = 'Websites';

		if($is_win) exec('mklink /j "' . $link . '" "' . $target . '"');
		else symlink($target, $link);
	}
	chdir($cwd);
}

Websites_0_8_Users_mysql();