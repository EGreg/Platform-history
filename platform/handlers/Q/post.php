<?php

function Q_post($params)
{
	$uri = Q_Dispatcher::uri();
	$module = $uri->module;
	$action = $uri->action;
	if (!Q::canHandle("$module/$action/post")) {
		throw new Q_Exception_MethodNotSupported(array('method' => 'POST'));
	}
	return Q::event("$module/$action/post", $params);
}
