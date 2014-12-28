<?php

/**
 * For including Qbix in your scripts
 */

//
// Constants -- you might have to change these
//
if (!defined('APP_DIR')) {
	define ('APP_DIR', realpath(dirname(__FILE__).DIRECTORY_SEPARATOR.'..'));
}

//
// Include Q
//
$header = "This is a Qbix project...";
if (!is_dir(APP_DIR)) {
	die("$header\nPlease edit scripts/Q.inc.php and change APP_DIR to point to your app's directory.\n");
}
$paths_filename = APP_DIR . '/local/paths.php';
$basename = basename(APP_DIR);
if (!file_exists($paths_filename)) {
	die("$header\nGo to $basename/scripts/Q directory and run php configure.php\n");
}
include($paths_filename);
include(realpath(Q_DIR.'/Q.php'));
