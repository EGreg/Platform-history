<?php

/**
 * Used to update EXISITNG stream
 *
 * @param string $params 
 *   publisher id and stream name of existing stream shall be supplied
 * @return void
 */

function Streams_stream_put($params) {
	// only logged in user can edit stream
	$user = Users::loggedInUser(true);
	
	$publisherId = Streams::requestedPublisherId();
	if (empty($publisherId)) {
		$publisherId = $_REQUEST['publisherId'] = $user->id;
	}
	$name = Streams::requestedName(true);
	$more_fields = array_merge($_REQUEST, $params);

	// do not set stream name
	$stream = new Streams_Stream();
	$stream->publisherId = $publisherId;
	$stream->name = $name;
	$retrieved = $stream->retrieve();
	$original = $stream->toArray();
	
	if (!$retrieved) {
		throw new Q_Exception_MissingRow(array(
			'table' => 'stream',
			'criteria' => "{publisherId: '$publisherId', name: '$streamName'}"
		));
	}
	
	// valid stream types shall be defined in config by 'Streams/type' array
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
		if (isset($more_fields[$r]) and !$owned) {
			throw new Users_Exception_NotAuthorized();
		}
	}
	
	// handle setting of attributes
	if (isset($more_fields['attributes']) and is_array($more_fields['attributes'])) {
		foreach ($more_fields['attributes'] as $k => $v) {
			$stream->setAttribute($k, $v);
		}
		unset($more_fields['attributes']);
	}
	
	$xtype = Q_Config::get('Streams', 'types', $stream->type, 'fields', array());
	foreach (array_merge(
		array('type', 'title', 'icon', 'content', 'attributes', 'readLevel', 'writeLevel', 'adminLevel'), 
		$xtype
	) as $f ) {
		if (isset($more_fields[$f])) {
			$stream->$f = $more_fields[$f];
		}
	}
	
	$to_save = $stream->toArray();
	$instructions = array();
	foreach ($to_save as $k => $v) {
		if (json_encode($original[$k]) !== json_encode($v)) {
			$instructions[$k] = $v; // record different value for this attribute
		}
	}
	unset($instructions['updatedTime']);
	
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
	
	$stream->retrieve(); // for now we have to do fetch the stream again, because stream's messageCount has updated
	
	if (!empty($more_fields['join'])) {
		$stream->join();
	}
	Streams::$cache['stream'] = $stream;
}