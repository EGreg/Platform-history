<?php

/*
 * This is the slot filled by the platform's
 * "Q/response" handler when the requested
 * slot returns null.
 * Check $module/$action/response/$slotName $module/$action/response/default handlers
 * then checks $module/$action/$slotName, Q/slots/$slotName views
 * If slot is not static, simply renders Q/slots/loader view and let client to load slot via AJAX
 * If the requested slot's function has already
 * been loaded, returns a string saying that
 * the slot should not return null.
 * @param array $params
 *  An array that should contain:
 *  "slotName" => The name of the slot to fill.
 * @return mixed
 *  Returns whatever the slot returned, or 
 *  a string indicating what you need to fix.
 */
function Q_response_default($params)
{
	$app = Q_Config::expect('Q', 'app');
	if (!isset($params['slotName'])) {
		throw new Q_Exception_RequiredField(array(
			'field' => '$slotName'
		));
	}
	$slotName = $params['slotName'];

	$uri = Q_Dispatcher::uri();
	$module = $uri->module;
	$action = $uri->action;
	$event = "$module/$action/response/$slotName";
	if (Q::canHandle($event)) {
		return Q::event($event);
	}
	return "Need to define $event\n";
}
