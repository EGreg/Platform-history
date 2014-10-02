#!/usr/bin/env php
<?php

include dirname(__FILE__).'/../Q.inc.php';

$script_name = pathinfo($_SERVER["SCRIPT_NAME"]);
switch ($script_name['filename']) {
	case 'install':
		$script = Q_DIR . '/scripts/app.php';
		break;
	case 'plugin':
		$script = Q_DIR . '/scripts/plugin.php';
		break;
	case 'shards':
		$script = Q_DIR . '/scripts/shards.php';
		break;
	case 'default':
		die($header . '[ERROR] ' . "Functionality is not supported");
}

$realpath = realpath($script);
if (!$realpath) {
	die($header . '[ERROR] ' . "Could not locate $script" . PHP_EOL);
}

define("PLUGIN_INSTALL_INTO_APP", APP_DIR);
include($realpath);