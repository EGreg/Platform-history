<?php

function Users_batch_response_batch()
{
	if (empty($_REQUEST['batch'])) {
		throw new Q_Exception_RequiredField(array('field' => 'batch'));
	}
	
	try {
		$batch = json_decode($_REQUEST['batch'], true);
	} catch (Exception $e) {
		
	}
	if (empty($batch)) {
		throw new Q_Exception_WrongValue(array('field' => 'batch', 'range' => 'valid JSON'));
	}
	
	if (empty($batch['args'])) {
		throw new Q_Exception_RequiredField(array('field' => 'args'));
	}

	// Gather the ids of users to fetch
	$to_fetch = array();
	foreach ($batch['args'] as $args) {
		list($action, $slots, $userId) = $args;
		$to_fetch[] = $userId;
	}
	$user = Users::loggedInUser();
	$userId = $user ? $user->id : "";
	
	// Fetch the actual users
	$users = Users_User::select('*')
		->where(array('id' => $to_fetch))
		->fetchDbRows(null, '', 'id');
	
	// Now, build the result
	$result = array();
	foreach ($batch['args'] as $args) {
		try {
			$action = $args[0];
			$prev_request = $_REQUEST;
			$extra = !empty($args[3]) ? $args[3] : null;
			if (is_array($extra)) {
				foreach ($extra as $k => $v) {
					$_REQUEST[$k] = $v;
				}
			}
			switch ($action) {
			case 'avatar':
				$_REQUEST['userIds'] = $args[2];
				break;
			}
			Q_Request::$slotNames_override = is_array($args[1]) ? $args[1] : explode(',', $args[1]);
			Q_Request::$method_override = 'GET';
			Q::event(
				"Users/$action/response", 
				compact('users', 'user', 'userId')
			);
			$slots = array_diff(Q_Response::slots(true), array('batch'));
			$result[] = compact('slots');
		} catch (Exception $e) {
			$result[] = array('errors' => Q_Exception::toArray(array($e)));
		}
		$prev_request = $_REQUEST;
		Q_Request::$slotNames_override = null;
		Q_Request::$method_override = null;
	}
	
	return $result;
}