<?php

/**
 * Default Q/response handler.
 * 1. Gets some slots, depending on what was requested.
 * 2. Renders them in a layout
 *    The layout expects "title", "dashboard" and "contents" slots to be filled.
 */
function Q_response($params)
{
	extract($params);
	/**
	 * @var Exception $exception
	 * @var array $errors
	 */
	if (empty($errors)) {
		$errors = Q_Response::getErrors();
	}
	
	if (!empty($_GET['Q_ct'])) {
		Q_Response::setCookie('Q_ct', $_GET['Q_ct']);
	}

	// Redirect to success page, if requested.
	$is_ajax = Q_Request::isAjax();
	if (empty($errors) and empty($exception)) {
		if (!$is_ajax and null !== Q_Request::special('onSuccess', null)) {
			$on_success = Q_Request::special('onSuccess', null);
			if (Q_Config::get('Q', 'response', 'onSuccessShowFrom', true)) {
				$on_success = Q_Uri::url($on_success.'?Q.fromSuccess='.Q_Dispatcher::uri());
			}
			Q_Response::redirect($on_success);
			return;
		}
	}

	// Get the requested module
	$uri = Q_Dispatcher::uri();
	if (!isset($module)) {
		$module = $uri->module;
		if (!isset($module)) {
			$module = 'Q';
			Q_Dispatcher::uri()->module = 'Q';
		}
	}

	if (!$is_ajax || Q_Request::isLoadExtras()) {
		Q::event('Q/responseExtras', array(), 'before');
	}

	// Get the main module (the app)
	$app = Q_Config::expect('Q', 'app');

	$action = $uri->action;
	if (Q::canHandle("$module/$action/response")) {
		if (false === Q::event("$module/$action/response") and !$is_ajax) {
			return;
		}
	}

	// What to do if this is an AJAX request
	if ($is_ajax) {
		$slot_names = Q_Request::slotNames(true);
		$to_encode = array();
		if (Q_Response::$redirected) {
			// We already called Q_Response::redirect
			$to_encode['redirect']['url'] = Q_Uri::url(Q_Response::$redirected);
			try {
				$to_encode['redirect']['uri'] = Q_Uri::from(Q_Response::$redirected)->toArray();
			} catch (Exception $e) {
				// couldn't get internal URI
			}
		} else if (is_array($slot_names)) {
			foreach ($slot_names as $slot_name) {
				Q_Response::fillSlot($slot_name, 'default');
			}
			// Go through the slots again, because other handlers may have overwritten
			// their contents using Q_Response::setSlot()
			foreach ($slot_names as $sn) {
				Q_Response::fillSlot($sn, 'default');
			}
			if (Q_Response::$redirected) {
				// While rendering the slots we called Q_Redirect
				$to_encode['redirect']['url'] = Q_Uri::url(Q_Response::$redirected);
				try {
					$to_encode['redirect']['uri'] = Q_Uri::from(Q_Response::$redirected)->toArray();
				} catch (Exception $e) {
					// couldn't get internal URI
				}
			} else {
				$to_encode['slots'] = Q_Response::slots(true);
				foreach (array_merge(array(''), $slot_names) as $slot_name) {
					$temp = Q_Response::stylesheetsArray($slot_name);
					if ($temp) $to_encode['stylesheets'][$slot_name] = $temp;
					$temp = Q_Response::stylesInline($slot_name);
					if ($temp) $to_encode['stylesInline'][$slot_name] = $temp;
					$temp = Q_Response::scriptsArray($slot_name);
					if ($temp) $to_encode['scripts'][$slot_name] = $temp;
					$temp = Q_Response::scriptLines($slot_name, true, "\n", false);
					if ($temp) $to_encode['scriptLines'][$slot_name] = $temp;
					$temp = Q_Response::scriptData($slot_name);
					if ($temp) $to_encode['scriptData'][$slot_name] = $temp;
					$temp = Q_Response::templateData($slot_name);
					if ($temp) $to_encode['templates'][$slot_name] = $temp;
				}
			}
		}
		$to_encode['timestamp'] = microtime(true);
		$echo = Q_Request::contentToEcho();
		if (isset($echo)) {
			$to_encode['echo'] = $echo;
		}

		switch (strtolower($is_ajax)) {
		case 'json':
		default:
			$json = json_encode(Q::cutoff($to_encode));
			$callback = Q_Request::callback();
			if (!Q_Response::$batch) {
				header("Content-type: " . ($callback ? "application/javascript" : "application/json"));
			}
			echo $callback ? "$callback($json)" : $json;
		}
		return;
	}

	// If this is a request for a regular webpage,
	// fill the usual slots and render a layout.

	if (Q_Response::$redirected) {
		return; // If already set a redirect header, simply return -- no reason to output all this HTML
	}

	static $added_Q_init = false;
	
	if (!$added_Q_init) {
		Q_Response::addScriptLine("
// Now, initialize Q
Q.init();
", null, 'Q');
		$added_Q_init = true;
	}
	

	// Get all the usual slots for a webpage
	$slot_names = Q_Request::slotNames(true);
	$slots = array();
	foreach ($slot_names as $sn) {
		Q_Response::fillSlot($sn, 'default');
	}

	// Go through the slots again, because other handlers may have overwritten
	// their contents using Q_Response::setSlot()
	foreach ($slot_names as $sn) {
		Q_Response::fillSlot($sn, 'default');
	}

	$output = Q_Response::output();
	if (isset($output)) {
		if ($output === true) {
			return;
		}
		if (is_string($output)) {
			echo $output;
		}
		return;
	}
	
	if (!$is_ajax or Q_Request::isLoadExtras()) {
		Q::event('Q/responseExtras', array(), 'after');
	}

	$slots = Q_Response::slots(true);

	// Render a full HTML layout
	$layout_view = Q_Response::layoutView();
	echo Q::view($layout_view, $slots);
}
