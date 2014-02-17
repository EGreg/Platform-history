#!/usr/bin/env php
<?php

include dirname(__FILE__).'/../Q.inc.php';

$script_name = pathinfo($_SERVER["SCRIPT_NAME"]);
switch ($script_name['filename']) {
	case 'install':
		$Q_script = Q_DIR . '/scripts/app.php';
		break;
	case 'plugin':
		$Q_script = Q_DIR . '/scripts/plugin.php';
		break;
	case 'shards':
		$Q_script = Q_DIR . '/scripts/shards.php';
		break;
	case 'default':
		die($header . '[ERROR] ' . "Functionality is not supported");
}

$r = realpath($Q_script);
if (!file_exists($r)) {
	$basename = basename(APP_DIR);
	die($header . '[ERROR] ' . "Could not locate $Q_script" . PHP_EOL
		. "Please have the correct path to Q platform in $basename/local/paths.php" . PHP_EOL);
}

define("RUNNING_FROM_APP", APP_DIR);

include($r);