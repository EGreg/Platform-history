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

	// do not set stream name
	$stream = Streams::fetchOne($user->id, $publisherId, $name);	
	if (!$stream) {
		throw new Q_Exception_MissingRow(array(
			'table' => 'stream',
			'criteria' => "{publisherId: '$publisherId', name: '$name'}"
		));
	}
	$original = $stream->toArray();
	
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
	
	$restricted = array('readLevel', 'writeLevel', 'adminLevel');
	$owned = $stream->testAdminLevel('own');
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
		$icon['subpath'] = "streams/{$stream->publisherId}/{$stream->name}";
		$timeLimit = Q_Config::get('Q', 'uploads', 'limits', 'image', 'time', 5*60*60);
		set_time_limit($timeLimit); // 5 min
		$saved = Q_Image::save($icon);
		Q_Response::setSlot('icon', $saved);
	}
	
	if (!empty($fieldNames)) {
		foreach ($fieldNames as $f) {
			if (isset($fields[$f])) {
				$stream->$f = $fields[$f];
			}
		}

		$instructions = array('changes' => array());
		foreach ($fieldNames as $f) {
			if (!isset($stream->$f)) continue;
			$v = $stream->$f;
			if (isset($original[$f])
			and json_encode($original[$f]) === json_encode($v)) {
				continue;
			}
			$instructions['changes'][$f] = in_array($f, $coreFields)
				? $v // record the changed value in the instructions
				: null; // record a change but the value may be too big, etc.
		}
		unset($instructions['changes']['updatedTime']);
	
		if ($suggest) {
			$stream->post($user->id, array(
				'type' => 'Streams/suggest',
				'content' => '',
				'instructions' => $instructions
			), true);
		} else {
			$stream->save();
			$stream->post($user->id, array(
				'type' => 'Streams/edited',
				'content' => '',
				'instructions' => $instructions
			), true);
		}
	}
	
	if (!empty($fields['join'])) {
		$stream->join();
	}
	Streams::$cache['stream'] = $stream;
}