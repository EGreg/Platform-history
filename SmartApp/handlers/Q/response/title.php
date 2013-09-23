<?php

function Q_response_title($params)
{
	$uri = Q_Dispatcher::uri();
	$module = $uri->module;
	$action = $uri->action;
	$event = "$module/$action/response/title";
	if (Q::canHandle($event)) {
		return Q::event($event);
	} else {
		extract($params);
		return Q_Config::expect('Q', 'app') . (!empty($title) ? " :: $title" : '');
	}
}
