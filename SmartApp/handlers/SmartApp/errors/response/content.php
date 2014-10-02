<?php

function SmartApp_errors_response_content($params)
{
	header('HTTP/1.0 503 Server Encountered Error');
	$url = Q_Request::url();
	return Q::view('SmartApp/column0/errors.php', compact('url'));
}
