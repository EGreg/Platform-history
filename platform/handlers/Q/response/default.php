<?php

/*
 * This is the slot filled by the platform's
 * "Q/response" handler when the requested
 * slot returns null.
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
	if (!isset($params['slot_name'])) {
		throw new Q_Exception_RequiredField(array(
			'field' => '$slot_name'
		));
	}
	$slot_name = $params['slot_name'];
	$uri = Q_Dispatcher::uri();
	$module = $uri->module;
	$action = $uri->action;
	if (!$module or !$action) {
		return "$module/$action is not a valid URI";
	}
	$event = "$module/$action/response/$slot_name";
	$function_name = $module.'_'.$action.'_response_'.$slot_name;
	if (function_exists($function_name)) {
		$result = Q::event($event);
		$result = isset($result) ? $result : "Don't return null from $function_name";
	}
	if (Q::canHandle($event)) {
		return Q::event($event);
	}
	throw new Q_Exception_MissingSlot(compact('event'));
}
