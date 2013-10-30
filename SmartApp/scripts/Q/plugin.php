#!/usr/bin/env php
<?php
//include dirname(__FILE__).'/../Q.inc.php';

//define("PLUGIN_INSTALL_INTO_APP", APP_DIR);

//
// Constants -- you might have to change these
//
define ('APP_DIR', realpath(dirname(dirname(dirname(__FILE__)))));

//
// Include Q
//
$header = "This is a Q Platform project..." . PHP_EOL;

if (!is_dir(APP_DIR)) {
	die($header . '[ERROR] ' . APP_DIR . " doesn't exist or is not a directory." . PHP_EOL . "Please edit plugin.php and change APP_DIR to point to your app's directory." . PHP_EOL);
}

$paths_filename = realpath(APP_DIR . '/local/paths.php');
if (!file_exists($paths_filename)) {
	$basename = basename(APP_DIR);

	die($header . '[ERROR] ' . "Could not locate Q Platform" . PHP_EOL . "Please copy $basename/local.sample to $basename/local, and edit $basename/local/paths.php" . PHP_EOL);
}

include($paths_filename);

$Q_script = realpath(Q_DIR . '/scripts/plugin.php');
if (!file_exists($Q_script)) {
	$basename = basename(APP_DIR);
	die($header . '[ERROR] ' . "Could not locate $Q_script" . PHP_EOL . "Please have the correct path to Q platform in $basename/local/paths.php");
}

define("PLUGIN_INSTALL_INTO_APP", APP_DIR);

include($Q_script);