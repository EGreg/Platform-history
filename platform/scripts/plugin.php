<?php
$FROM_APP = defined('PLUGIN_INSTALL_INTO_APP'); //Are we running from app or framework?

#Arguments
$argv = $_SERVER['argv'];
$count = count($argv);

#Usage strings
$usage = "Usage: php {$argv[0]} " . ($FROM_APP ? '<plugin_name>' : '<plugin_name> <app_root>'). ' [-su options [-su options] ... ]';

if(!$FROM_APP)
	$usage.=PHP_EOL.PHP_EOL.'<app_root> must be a path to the application root directory';

$usage = <<<EOT
$usage

<plugin_name> must be a plugin name to install a particular plugin or '--all' to install all plugins

Options:

-s \$CONN_NAME
  This will execute plugin's install/upgrade sql scripts for connections \$CONN_NAME.
  Note: running SQL statements may reqire elevated privileges.

-su \$CONN_NAME \$USER_NAME
  This will execute plugin's install/upgrade sql scripts for connections \$CONN_NAME, using indicated username and will prompt for a password.
  Note: running SQL statements may reqire elevated privileges.

--noreq
  Skip requirements checking (useful when installing 2 interdependent plugins)

--trace
  Print stacktraces on errors 

EOT;

$help = <<<EOT
Script to install a plugin.

1) Place the plugin dir into the \$Q_Framework/plugins dir
2) Customize the database config in your \$local dir to add the necessary DB connections
3) Run this script.

$usage

EOT;

#Is it a call for help?
if (isset($argv[1]) and $argv[1] == '-help')
	die($help);

#Check primary arguments count: 2 if running /app/scripts/Q/plugin.php, 3 if running /framework/scripts/plugin.php
if ($count < ($FROM_APP ? 2 : 3))
	die($usage);

#Read primary arguments
$PLUGIN_NAME = $argv[1];
$LOCAL_DIR = $FROM_APP ? PLUGIN_INSTALL_INTO_APP : $argv[2];

#Check paths
if (!file_exists($Q_filename = dirname(__FILE__) . DIRECTORY_SEPARATOR . 'Q.inc.php')) #Q framework
	die("[ERROR] $Q_filename not found" . PHP_EOL);

if (!is_dir($LOCAL_DIR)) #App dir
	die("[ERROR] $LOCAL_DIR doesn't exist or is not a directory" . PHP_EOL);

#Define APP_DIR
if (!defined('APP_DIR'))
	define('APP_DIR', $LOCAL_DIR);

#Include Q
try {
	include($Q_filename);
}
catch (Exception $e)
{
	die('[ERROR] ' . $e->getMessage() . PHP_EOL . $e->getTraceAsString() . PHP_EOL);
}

#Parse secondary arguments -sql, -sql-user-pass, -auto-install-prerequisites
$options = array();

$sql_array = array();
$auto_install_prerequisites = false;

$mode = '';
for ($i = ($FROM_APP ? 2 : 3); $i < $count; ++$i) {
	switch ($mode) {
		case 'sql':
			$sql_array[$argv[$i]] = array('enabled'=>true);
			$mode = '';
			break;
		case 'sql-user-pass':
			$sql_array[$argv[$i]] = array(
				'enabled'=>true,
				'username' => $argv[$i + 1],
				'password' => true //$argv[$i + 2]
			);
			$i = $i + 1;
			$mode = '';
			break;
		case '':
			switch ($argv[$i]) {
				case '-s':
					if ($i + 1 > $count - 1) {
						echo "Not enough parameters to $argv[$i] option\n$usage";
						exit;
					}
					$mode = 'sql';
					break;
				case '-su':
					if ($i + 2 > $count - 1) {
						echo "Not enough parameters to $argv[$i] option\n$usage";
						exit;
					}
					$mode = 'sql-user-pass';
					break;
				case '--trace':
					$trace = true;
					break;
				case '--noreq':
					$options['noreq'] = true;
					break;
			}
			break;
	}
}

$options['sql'] = $sql_array;

//echo $PLUGIN_NAME.PHP_EOL;
//print_r($options);

try {
	echo 'Q Framework plugin installer'.PHP_EOL;
	if($PLUGIN_NAME=='--all')
	{
		if(!$all = Q_Config::get('Q', 'plugins', null))
			die('No plugins were installed');

		foreach($all as $pl)
			Q_Plugin::installPlugin($pl, $options);
	}
	else
		Q_Plugin::installPlugin($PLUGIN_NAME, $options);
}
catch (Exception $e)
{
	die('[ERROR] ' . $e->getMessage() . PHP_EOL . (isset($trace) ? $e->getTraceAsString() . PHP_EOL : ''));
}