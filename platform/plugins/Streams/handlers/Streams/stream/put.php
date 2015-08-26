<?php

/**
 * Used to update an existing stream
 *
 * @param string $params Must include "publisherId" as well as "name" or "streamName".
 *    Can also include 'type', 'title', 'icon', 'content', 'attributes', 'readLevel',
 *    'writeLevel', 'adminLevel', as well as any fields named in the
 *    'Streams'/'types'/$type/'fields' config field for this $type of stream.
 * @param {string} [$params.publisherId] The id of the user publishing the stream
 * @param {string} [$params.name] The name of the stream
 * @param {string} [$params.streamName] Alternatively, the name of the stream
 * @param {array} [$params.attributes] Array of attributeName => value to set in stream.
 * @param {array} [$params.icon] Optional array of icon data (see Q_Image::save params)
 * @return {}
 */

function Streams_stream_put($params) {
	// only logged in user can edit stream
	$user = Users::loggedInUser(true);
	
	$publisherId = Streams::requestedPublisherId();
	if (empty($publisherId)) {
		$publisherId = $_REQUEST['publisherId'] = $user->id;
	}
	$name = Streams::requestedName(true);
	$fields = array_merge($_REQUEST, $params);
	$closedTime = Q::ifset($fields, 'closedTime', null);
	if (in_array($closedTime, array(false, 'false', 'null'))) {
		$fields['closedTime'] = null;
	}

	// do not set stream name
	$stream = Streams::fetchOne($user->id, $publisherId, $name);	
	if (!$stream) {
		throw new Q_Exception_MissingRow(array(
			'table' => 'stream',
			'criteria' => "{publisherId: '$publisherId', name: '$name'}"
		));
	}
	
	// valid stream types should be defined in config by 'Streams/type' array
	$range = Q_Config::expect('Streams', 'types');
	if (!array_key_exists($stream->type, $range)) {
		throw new Q_Exception("This app doesn't support streams of type ".$stream->type);
	}
	
	// check if editing directly from client is allowed
	if (!Q_Config::get("Streams", "types", $stream->type, 'edit', false)) {
		throw new Q_Exception("This app doesn't support directly editing streams of type '{$stream->type}'");
	}
	
	$suggest = false;
	if ($stream->publisherId != $user->id) {
		$stream->calculateAccess($user->id);
		if (!$stream->testWriteLevel('edit')) {
			if ($stream->testWriteLevel('suggest')) {
				$suggest = true;
			} else {
				throw new Users_Exception_NotAuthorized();
			}
		}
	}
	
	$restricted = array('readLevel', 'writeLevel', 'adminLevel', 'closedTime');
	$owned = $stream->testAdminLevel('own'); // owners can reopen streams
	foreach ($restricted as $r) {
		if (isset($fields[$r]) and !$owned) {
			throw new Users_Exception_NotAuthorized();
		}
	}
	
	// handle setting of attributes
	if (isset($fields['attributes'])
	and is_array($fields['attributes'])) {
		foreach ($fields['attributes'] as $k => $v) {
			$stream->setAttribute($k, $v);
		}
		unset($fields['attributes']);
	}
	
	// Get all the extended field names for this stream type
	$fieldNames = Streams::getExtendFieldNames($stream->type);

	// Process any icon that was posted
	$icon = Q::ifset($fieldNames, 'icon', null);
	if (is_array($icon)) {
		unset($fieldNames['icon']);
		Q_Response::setSlot('icon', Q::event("Q/image/post", $icon));
	}
	
	if (!empty($fieldNames)) {
		foreach ($fieldNames as $f) {
			if (array_key_exists($f, $fields)) {
				$stream->$f = $fields[$f];
			}
		}
		$stream->changed($user->id,  $suggest ? 'Streams/suggest' : 'Streams/changed');
	}
	
	if (!empty($fields['join'])) {
		$stream->join();
	}
	Streams::$cache['stream'] = $stream;
}