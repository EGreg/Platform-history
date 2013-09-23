<?php

/*
 * This is the slot filled by the platform's
 * "Q/response" handler when the requested
 * slot returns null.
 * Check $module/$action/response/$slot_name $module/$action/response/default handlers
 * then checks $module/$action/$slot_name, Q/slots/$slot_name views
 * If slot is not static, simply renders Q/slots/loader view and let client to load slot via AJAX
 * If the requested slot's function has already
 * been loaded, returns a string saying that
 * the slot should not return null.
 * @param array $params
 *  An array that should contain:
 *  "slot_name" => The name of the slot to fill.
 * @return mixed
 *  Returns whatever the slot returned, or 
 *  a string indicating what you need to fix.
 */
function Q_response_default($params)
{
	$app = Q_Config::expect('Q', 'app');
	if (!isset($params['slot_name'])) {
		throw new Q_Exception_RequiredField(array(
			'field' => '$slot_name'
		));
	}
	$slot_name = $params['slot_name'];

	$uri = Q_Dispatcher::uri();
	$module = $uri->module;
	$action = $uri->action;
	$event = "$module/$action/response/$slot_name";
	if (Q::canHandle($event)) {
		return Q::event($event);
	}
	return "Need to define $event\n";
}
