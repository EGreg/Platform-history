<?php

function Q_post($params)
{
	$uri = Q_Dispatcher::uri();
	$module = $uri->module;
	$action = $uri->action;
	if (!Q::canHandle("$module/$action/post")) {
		throw new Q_Exception_MethodNotSupported(array('method' => 'POST'));
	}
	if (isset($_SERVER['CONTENT_LENGTH'])) {
		$contentLength = (int)$_SERVER['CONTENT_LENGTH'];
		foreach (array('upload_max_filesize', 'post_max_size') as $name) {
			$value = ini_get($name);
			switch (substr($value, -1)) {
				case 'K': $value *= 1024; break;
				case 'M': $value *= 1024*1024; break;
				case 'B': $value *= 1024*1024*1024; break;
			}
			if ($contentLength > $value) {
				throw new Q_Exception_ContentLength(array('contentLength' => $contentLength, 'exceeds' => $name));
			}
		}
	}
	return Q::event("$module/$action/post", $params);
}
