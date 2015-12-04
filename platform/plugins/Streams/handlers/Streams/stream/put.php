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
	$req = array_merge($_REQUEST, $params);
	
	$closedTime = Q::ifset($req, 'closedTime', null);
	if (in_array($closedTime, array(false, 'false', 'null'))) {
		$req['closedTime'] = null;
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
	
	$restricted = array('readLevel', 'writeLevel', 'adminLevel', 'inheritAccess', 'closedTime');
	$owned = $stream->testAdminLevel('own'); // owners can reopen streams
	foreach ($restricted as $r) {
		if (isset($req[$r]) and !$owned) {
			throw new Users_Exception_NotAuthorized();
		}
	}
	
	// handle setting of attributes
	if (isset($req['attributes'])
	and is_array($req['attributes'])) {
		foreach ($req['attributes'] as $k => $v) {
			$stream->setAttribute($k, $v);
		}
		unset($req['attributes']);
	}
	
	// Get all the extended field names for this stream type
	$fieldNames = Streams::getExtendFieldNames($stream->type);

	// Process any icon that was posted
	$icon = Q::ifset($fieldNames, 'icon', null);
	if (is_array($icon)) {
		unset($fieldNames['icon']);
		Q_Response::setSlot('icon', Q::event("Q/image/post", $icon));
	}
	
	// Process any file that was posted
	$file = Q::ifset($fieldNames, 'file', null);
	if (is_array($file)) {
		unset($fieldNames['file']);
		Q_Response::setSlot('file', Q::event("Q/file/post", $icon));
	}
	
	if (!empty($fieldNames)) {
		foreach ($fieldNames as $f) {
			if (array_key_exists($f, $req)) {
				$stream->$f = $req[$f];
			}
		}
		$stream->changed($user->id,  $suggest ? 'Streams/suggest' : 'Streams/changed');
	}
	
	if (!empty($req['join'])) {
		$stream->join();
	}
	Streams::$cache['stream'] = $stream;
}