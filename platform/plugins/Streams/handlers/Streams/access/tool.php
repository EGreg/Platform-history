<?php

/**
 * Access tool
 * @param array $options
 *  "publisherId" => the id of the user who is publishing the stream
 *  "streamName" => the name of the stream for which to edit access levels
 *  "tabs" => optional array of tab name => title. Defaults to read, write, admin tabs.
 *  "ranges" => optional. Associative array with keys "read", "write", "admin"
 *    and values as associative arrays of ($min, $max) for the displayed levels.
 *  "controls" => optionally set this to true to render only the controls
 */
function Streams_access_tool($options)
{
	$tabs = array(
		'read'  => 'visible to', 
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

	reset($tabs);
	$tab = Q::ifset($_REQUEST, 'tab', key($tabs));

	$stream = Streams::fetchOne($user->id, $publisherId, $streamName);
    if (!$stream) {
        throw new Q_Exception_MissingRow(array(
            'table' => 'stream',
            'criteria' => 'with that name'
        ));
	}
	$stream->addPreloaded($user->id);

	$stream = Streams::fetchOne($user->id, $publisherId, $streamName);
	if (!$stream) {
		throw new Q_Exception_MissingRow(array(
			'table' => 'stream',
			'criteria' => 'with that name'
		));
	}

	if (!$stream->testAdminLevel('own')) {
		throw new Users_Exception_NotAuthorized();
	}

	$access_array = Streams_Access::select('*')
		->where(array(
			'publisherId' => $stream->publisherId,
			'streamName' => $stream->name,
		))->andWhere("{$tab}Level != -1")->fetchDbRows();
		
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
	
	$accessActionUrl = Q_Uri::url("Streams/access?publisherId=$publisherId&streamName=$streamName");
	
	$dir = Q_Config::get('Users', 'paths', 'icons', 'files/Users/icons');
	
	$accessArray = Db::exportArray($access_array);
	$avatarArray = Db::exportArray($avatar_array);

	if (empty($controls)) {
		Q_Response::addScript("plugins/Streams/js/Streams.js");
		Q_Response::addScript("plugins/Streams/js/tools/access.js");
		Q_Response::setToolOptions(compact(
			'accessArray', 'avatarArray', 'labels', 
			'icons', 'tab', 'publisherId', 
			'streamName'
		));
	} else {
		$extra = compact('stream', 'accessArray', 'avatarArray');
		Q_Response::setSlot('extra', $extra);
	}

	return Q::view('Streams/tool/access.php', compact(
		'stream', 'access_array', 'contact_array', 'label_array', 'tabs', 'tab', 'labels', 'icons', 'levels', 'dir', 'publisherId', 'streamName', 'accessActionUrl',
		'controls'
	));
}