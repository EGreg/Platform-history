<?php

/**
 * @module Q
 */

/**
 * Web controller - excecutes web request
 * @class Q_WebController
 */
class Q_WebController
{
	/**
	 * Excecute web request
	 * @method excecute
	 * @static
	 */
	static function execute()
	{
		// Fixes for different platforms:
		if (isset($_SERVER['HTTP_X_REWRITE_URL'])) { // ISAPI 3.0
			$_SERVER['REQUEST_URI'] = $_SERVER['HTTP_X_REWRITE_URL'];
		}
		
		// Get the base URL
		$base_url = Q_Request::baseUrl();
		if (Q::$controller === 'Q_ActionController') {
			// we detected action.php in the URL, but 
			// a misconfigured web server executed index.php instead
			return Q_ActionController::execute();
		}
		
		// Set the controller that is being used
		if (!isset(Q::$controller)) {
			Q::$controller = 'Q_WebController';
		}
		
		try {
			$slots = Q_Request::slotNames(false);
			$slots = $slots ? ' slots: ('.implode(',', $slots).') from' : '';
			$method = Q_Request::method();
			Q::log("$method$slots url: " . Q_Request::url(true));
			Q_Dispatcher::dispatch();
			$dispatch_result = Q_Dispatcher::result();
			if (!isset($dispatch_result)) {
				$dispatch_result = 'Ran dispatcher';
			}
			$uri = Q_Request::uri();
			$module = $uri->module;
			$action = $uri->action;
			if ($module and $action) {
				$slot_names = Q_Request::slotNames();
				$returned_slots = empty($slot_names) 
					? '' 
					: implode(',', $slot_names);
				Q::log("~" . ceil(Q::microseconds()) . 'ms+'
					. ceil(memory_get_peak_usage()/1000) . 'kb.'
					. " $dispatch_result for $module/$action"
					. " ($returned_slots)"
				);
			} else {
				Q::log("~" . ceil(Q::microseconds()) . 'ms+'
					. ceil(memory_get_peak_usage()/1000) . 'kb.'
					. " $dispatch_result No route for " . $_SERVER['REQUEST_URI']);
			}
		} catch (Exception $exception) {
			/**
			 * @event Q/exception
			 * @param {Exception} 'exception'
			 */
			Q::event('Q/exception', compact('exception'));
		}
	}
}
