#!/usr/bin/env php
<?php
//
// Constants -- you might have to change these
//
define ('APP_DIR', realpath(dirname(dirname(dirname(__FILE__)))));

//
// Include Q
//
$header = "This is a Qbix Platform project..." . PHP_EOL;

if (!is_dir(APP_DIR)) {
	die($header . '[ERROR] ' . APP_DIR . " doesn't exist or is not a directory." . PHP_EOL . "Please edit install.php and change APP_DIR to point to your app's directory." . PHP_EOL);
}

$paths_filename = realpath(APP_DIR . '/local/paths.php');
if (!file_exists($paths_filename)) {
	$basename = basename(APP_DIR);

	die($header . '[ERROR] ' . "Could not locate Qbix Platform" . PHP_EOL . "Please copy $basename/local.sample to $basename/local, and edit $basename/local/paths.php" . PHP_EOL);
}

include($paths_filename);

$script_name = pathinfo($_SERVER["SCRIPT_NAME"]);
switch ($script_name['filename']) {
	case 'install':
		$Q_script = realpath(Q_DIR . '/scripts/app.php');
		break;
	case 'plugin':
		$Q_script = realpath(Q_DIR . '/scripts/plugin.php');
		break;
	case 'shards':
		$Q_script = realpath(Q_DIR . '/scripts/shards.php');
		break;
	case 'default':
		die($header . '[ERROR] ' . "Functinality is not supported");
}

if (!file_exists($Q_script)) {
	$basename = basename(APP_DIR);
	die($header . '[ERROR] ' . "Could not locate $Q_script" . PHP_EOL . "Please have the correct path to Qbix platform in $basename/local/paths.php");
}

define("RUNNING_FROM_APP", APP_DIR);

include($Q_script);