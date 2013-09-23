<?php

function Q_response_notices()
{
	$uri = Q_Dispatcher::uri();
	$module = $uri->module;
	$action = $uri->action;
	$event = "$module/$action/response/notices";
	if (Q::canHandle($event)) {
		return Q::event($event);
	} else {
		$notices = Q_Response::getNotices();
		$errors = Q_Response::getErrors();
		return Q::view("SmartApp/notices.php", compact('notices', 'errors'));
	}
}
