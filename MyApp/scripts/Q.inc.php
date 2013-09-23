<?php

/**
 * For including Q in your scripts
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
$header = "This is a Q project...";
if (!is_dir(APP_DIR)) {
	die("$header
	Please edit scripts/Q.inc.php and change APP_DIR to point to your app's directory.
");
}
$paths_filename = APP_DIR . '/local/paths.php';
$basename = basename(APP_DIR);
if (!file_exists($paths_filename)) {
	die("$header
	Go to $basename/scripts/Q directory and run php configure.php
");
}
include($paths_filename);
include(realpath(Q_DIR.'/Q.php'));
