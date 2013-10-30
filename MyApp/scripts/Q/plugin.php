#!/usr/bin/env php
<?php

include dirname(__FILE__).'/../Q.inc.php';

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
		die($header . '[ERROR] ' . "Functionality is not supported");
}

if (!file_exists($Q_script)) {
	$basename = basename(APP_DIR);
	die($header . '[ERROR] ' . "Could not locate $Q_script" . PHP_EOL . "Please have the correct path to Q framework in $basename/local/paths.php");
}

define("RUNNING_FROM_APP", APP_DIR);

include($Q_script);