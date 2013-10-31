<?php
if (!defined('RUNNING_FROM_APP') or !defined('CONFIGURE_ORIGINAL_APP_NAME')) {
	die("This script can only be run from an app template.");
}

#Arguments
$argv = $_SERVER['argv'];
$count = count($argv);

#Usage strings
$usage = "Usage: php {$argv[0]} " . "<desired_app_name>\n";

$help = <<<EOT
This script automatically does the proper steps to configure an app template into an app that you name.
Run it before running install.php.

EOT;

#Is it a call for help?
if (isset($argv[1]) and $argv[1] == '-help')
	die($help);

#Check primary arguments count: 1 if running /app/scripts/Q/install.php, 2 if running /framework/scripts/app.php
if ($count < 2)
	die($usage);

#Read primary arguments
$LOCAL_DIR = APP_DIR;

$desired = $argv[1];

do {
	$go_again = false;
	foreach (
		$iterator = new RecursiveIteratorIterator(
			new RecursiveDirectoryIterator(
				APP_DIR, 
				RecursiveDirectoryIterator::SKIP_DOTS
			),
			RecursiveIteratorIterator::SELF_FIRST
		) as $filename
	) {
		$pi = pathinfo($filename);
		if ($pi['filename'] === CONFIGURE_ORIGINAL_APP_NAME) {
			$pi['filename'] = $desired;
		}
		$filename2 = $pi['dirname'] . '/' . $pi['filename']
			. (empty($pi['extension']) ? '' : '.' . $pi['extension']);
		if ($filename != $filename2) {
			rename($filename, $filename2);
			$go_again = true;
			break;
		}
	}
} while($go_again);

$it = new RecursiveDirectoryIterator(APP_DIR);
foreach(new RecursiveIteratorIterator($it) as $filename) {
	if (is_dir($filename) or is_link($filename)) continue;
	$file = file_get_contents($filename);
	file_put_contents($filename, preg_replace(
		"/".CONFIGURE_ORIGINAL_APP_NAME."/",
		$desired,
		$file
	));
}

$uploads_dir = APP_FILES_DIR.DS.$desired.DS.'uploads';
if (is_dir($uploads_dir)) {
	$cwd = getcwd();
	chdir(APP_WEB_DIR);
	if (file_exists('uploads')) {
		unlink('uploads');
	}
	symlink('..'.DS.'files'.DS.$desired.DS.'uploads', 'uploads');
	chdir($cwd);
}

try {
	$filename = APP_VIEWS_DIR . DS . $desired . DS . "content" . DS . "welcome.php";
	if (file_exists($filename)) {
		$basename = basename(APP_DIR);
		$file = file_put_contents($filename, <<<EOT
<div id='content'>
	<div style="padding: 50px;">
		After the app has been configured, the next steps are:
		<ul>
			<li>Edit database connections and other credentials in local/app.json</li>
			<li><pre>Run php $basename/scripts/Q/install.php --all</php></li>
			<li>Start working on your app!</li>
		</ul>
		Speed check: this rendered in <?php echo ceil(Q::microseconds()) ?> ms.
	</div>
</div>
		
EOT
		);
	}
} catch (Exception $e) {
	
}

echo "Application configured. The next steps are:
1) edit the config in $basename/local/app.json
2) run $basename/scripts/Q/install.php --all
";
