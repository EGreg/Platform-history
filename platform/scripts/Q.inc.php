<?php

/**
 * Included by framework scripts, not app scripts
 */

//
// Include Q
//
if (!defined('Q_DIR'))
	define('Q_DIR', dirname(dirname(__FILE__)));

include(realpath(Q_DIR.'/Q.php'));
