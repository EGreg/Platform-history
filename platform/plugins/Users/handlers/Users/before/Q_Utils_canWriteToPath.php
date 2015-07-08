<?php

function Users_before_Q_Utils_canWriteToPath($params, &$result)
{
	extract($params);
	/**
	 * @var $path
	 * @var $throw_if_not_writeable
	 * @var $mkdir_if_missing
	 */

	// The Users plugin requires that a user be logged in before uploading a file,
	// and only in the proper directories.
	$user = Users::loggedInUser($throw_if_not_writeable);
	if (!$user) {
		return false;
	}
	$app = Q_Config::expect('Q', 'app');
	$subpaths = Q_Config::get('Users', 'paths', 'uploads', array('files/$app/uploads/user-$userId'));
	$paths = array();
	foreach ($subpaths as $subpath => $can_write) {
		if (!$can_write) continue;
		$subpath = Q::interpolate($subpath, array('userId' => $user->id, 'app' => $app));
		if ($subpath and ($subpath[0] !== '/' or $subpath[0] !== DS)) {
			$subpath = DS.$subpath;
		}
		$last_char = substr($subpath, -1);
		if ($subpath and $last_char !== '/' and $last_char !== DS) {
			$subpath .= DS;
		}
		$paths[] = APP_DIR.$subpath;
		foreach (Q_Config::get('Q', 'plugins', array()) as $plugin) {
			$c = strtoupper($plugin).'_PLUGIN_DIR';
			if (defined($c)) {
				$paths[] = constant($c).$subpath;
			}
		}
		$paths[] = Q_DIR.$subpath;
	}
	if (strpos($path, "../") === false
	and strpos($path, "..".DS) === false) {
		foreach ($paths as $p) {
			$len = strlen($p);
			if (strncmp($path, $p, $len) === 0) {
				// we can write to this path
				if ($mkdir_if_missing and !file_exists($path)) {
					$mode = is_integer($mkdir_if_missing)
						? $mkdir_if_missing
						: 0777;
					if (!@mkdir($path, 0777, true)) {
						throw new Q_Exception_FilePermissions(array(
							'action' => 'create',
							'filename' => $path,
							'recommendation' => ' Please set your files directory to be writable.'
						));
					}
					$dir3 = $path;
					do {
						chmod($dir3, $mode);
						$dir3 = dirname($dir3);
					} while ($dir3 and $dir3 != $p and $dir3.DS != $p);
				}
				$result = true;
				return;
			}
		}
	}
	if ($throw_if_not_writeable) {
		throw new Q_Exception_CantWriteToPath();
	}
	$result = false;
}
