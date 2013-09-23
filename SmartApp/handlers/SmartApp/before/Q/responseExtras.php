<?php

function SmartApp_before_Q_responseExtras()
{
	$app = Q_Config::expect('Q', 'app');
	
	if (Q_Config::get('Q', 'firebug', false)){
		Q_Response::addScript("https://getfirebug.com/firebug-lite-debug.js");
	}
	
	Q_Response::addScript('plugins/Q/js/iscroll.js');
	Q_Response::addScript('js/jQuery.bbq.js');
	
	Q_Response::addStylesheet('plugins/Q/css/Ui.css');
	Q_Response::addStylesheet('css/html.css');
	Q_Response::addStylesheet('css/iphone.css');
	
	Q_Response::addScript('js/SmartApp.js');

	if (Q_Request::isTablet()) {
		Q_Response::addStylesheet('plugins/Q/css/tablet.css');
	} else if (Q_Request::isMobile()) {
		Q_Response::addStylesheet('plugins/Q/css/mobile.css');
	} else {
		Q_Response::addStylesheet('plugins/Q/css/desktop.css');
	}
	
	Q_Response::setScriptData('Q.Layout.use', true);
	
	// running an event for loading action-specifig extras (if there are any)
	$uri = Q_Dispatcher::uri();
	$module = $uri->module;
	$action = $uri->action;
	$event = "$module/$action/response/responseExtras";
	if (Q::canHandle($event)) {
		Q::event($event);
	}
}
