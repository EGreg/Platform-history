<?php

function SmartApp_notFound_response_column0($params)
{
	header('HTTP/1.0 404 Not Found');
	$url = Q_Request::url();
	if (Q_Request::isAjax()) {
		throw new Q_Exception_NotFound(compact('url'));
	}
	return Q::view('SmartApp/column0/notFound.php', compact('url'));
}
