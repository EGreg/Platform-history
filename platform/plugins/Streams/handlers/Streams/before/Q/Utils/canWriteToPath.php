<?php

function Streams_before_Q_Utils_canWriteToPath($params, &$result)
{
	extract($params);
	/**
	 * @var $path
	 * @var $throw_if_not_writeable
	 * @var $mkdir_if_missing
	 */
	
	// Assume that Users/before/Q/Utils/canWriteToPath already executed

	$result = false;

	$user = Users::loggedInUser();
	$userId = $user ? $user->id : "";
	$app = Q_Config::expect('Q', 'app');
	$len = strlen(APP_DIR);
	if (substr($path, 0, $len) === APP_DIR) {
		$sp = str_replace(DS, '/', substr($path, $len+1));
		$prefix = "files/$app/uploads/streams/";
		$len = strlen($prefix);
		if (substr($sp, 0, $len) === $prefix) {
			$parts = explode('/', substr($sp, $len));
			if (count($parts) >= 3) {
				$publisherId = $parts[0];
				$name = $parts[1] . '/' . $parts[2];
				if ($stream = Streams::fetchOne($userId, $publisherId, $name)) {
					$result = $stream->testWriteLevel('edit');
				}
			}
		}
	}
	if (!$result and $throw_if_not_writeable) {
		throw new Q_Exception_CantWriteToPath();
	}
}
