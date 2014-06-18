<?php

/**
 * Access tool
 * @param array $options
 *  "publisherId" => the id of the user who is publishing the stream
 *  "streamName" => the name of the stream for which to edit access levels
 *  "tabs" => optional array of tab name => title. Defaults to read, write, admin tabs.
 *  "ranges" => optional. Associative array with keys "read", "write", "admin"
 *    and values as associative arrays of ($min, $max) for the displayed levels.
 */
function Streams_access_tool($options)
{
	$tabs = array(
		'read' => 'visible to', 
		'write' => 'editable by', 
		'admin' => 'members'
	);
	extract($options);
	$user = Users::loggedInUser(true);
	/**
	 * @var string $streamName
	 */
	if (empty($streamName)) {
		$streamName = Streams::requestedName(true);
	}
	if (empty($publisherId)) {
		$publisherId = Streams::requestedPublisherId();
		if (empty($publisherId)) {
			$publisherId = $user->id;
		}
	}

	$stream = Streams::fetchOne($user->id, $publisherId, $streamName);
    if (!$stream) {
        throw new Q_Exception_MissingRow(array(
            'table' => 'stream',
            'criteria' => 'that name'
        ));
    }
	if (!$stream->testAdminLevel('own')) {
		throw new Users_Exception_NotAuthorized();
	}

	$access_array = Streams_Access::select('*')
		->where(array(
			'publisherId' => $stream->publisherId,
			'streamName' => $stream->name
		))->fetchDbRows();
		
	$contact_array = Users_Contact::select('*')
		->where(array(
			'userId' => $stream->publisherId
		))->groupBy('userId, label')
		->fetchDbRows();
		
	$label_array = Users_Label::select('*')
		->where(array(
			'userId' => $stream->publisherId
		))->fetchDbRows(null, null, 'label');
	
	$userId_list = array();
	foreach ($access_array as $a) {
		if ($a->ofUserId) {
			$userId_list[] = $a->ofUserId;
		}
	}
	$avatar_array = empty($userId_list)
		? array()
		: Streams_Avatar::fetch($user->id, $userId_list);
	
	$labels = array();
	$icons = array();
	foreach ($contact_array as $contact) {
		$labels[$contact->label] = $contact->label;
		$icons[$contact->label] = 'label';
	}
	foreach ($label_array as $label) {
		if (isset($labels[$label->label])) {
			$labels[$label->label] = $label->title;
			$icons[$label->label] = 'label_'.$user->id.'_'.$label->label;
		}
	}

    reset($tabs);
	$tab = Q::ifset($_REQUEST, 'tab', key($tabs));
	
	switch ($tab) {
		case 'read':
			$levels = Q_Config::get('Streams', 'readLevelOptions', array());
			break;
		case 'write':
			$levels = Q_Config::get('Streams', 'writeLevelOptions', array());
			break;
		case 'admin':
			$levels = Q_Config::get('Streams', 'adminLevelOptions', array());
			break;
	}
	if (isset($ranges[$tab])) {
		$range_min = reset($ranges[$tab]);
		$range_max = end($ranges[$tab]);
		foreach ($levels as $k => $v) {
			if ($k < $range_min) {
				unset($levels[$k]);
			}
			if ($k > $range_max) {
				unset($levels[$k]);
			}
		}
	}
	
	$dir = Q_Config::get('Users', 'paths', 'icons', 'files/Users/icons');

	Q_Response::addScript("plugins/Streams/js/tools/access.js");
	Q_Response::addScript("plugins/Streams/js/Streams.js");
	Q_Response::setToolOptions(compact('stream', 'access_array', 'avatar_array', 'labels', 'icons', 'tab'));
	
	return Q::view('Streams/tool/access.php', compact(
		'stream', 'access_array', 'contact_array', 'label_array', 'tabs', 'tab', 'labels', 'icons', 'levels', 'dir'
	));
}