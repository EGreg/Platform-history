<?php

/**
 * Used to create a new stream
 *
 * @param {array} $_REQUEST 
 *   publisherId, type
 *   Q.Streams.related.publisherId, Q.Streams.related.name, Q.Streams.related.weight
 *   dontSubscribe (optional)
 *   icon (optional) see fields for Q/image/post
 * @return void
 */

function Streams_stream_post($params) {
	$user = Users::loggedInUser(true);
	$publisherId = Streams::requestedPublisherId();
	if (empty($publisherId)) {
		$publisherId = $_REQUEST['publisherId'] = $user->id;
	}
	$type = Streams::requestedType(true);
	$more_fields = array_merge($_REQUEST, $params);

    $types = Q_Config::expect('Streams', 'types');
    if (!array_key_exists($type, $types)) {
        throw new Q_Exception("This app doesn't support streams of type $type", 'type');
    }
    if (empty($types[$type]['create'])) {
        throw new Q_Exception("This app doesn't support directly creating streams of type $type", 'type');
    }

	// Should this stream be related to another stream?
	$relate = array();
	$relate['streamName'] = Q_Request::special("Streams.related.streamName", null);
	if (isset($relate['streamName'])) {
		$relate['publisherId'] = Q_Request::special("Streams.related.publisherId", $publisherId);
		$relate['type'] = Q_Request::special("Streams.related.type", "");
		$weight = "+1"; // TODO: introduce ways to have "1" and "+1" for some admins etc.
	}

	// See whether user is authorized to create this stream
	if (!Streams::isAuthorizedToCreate($user->id, $publisherId, $type, $relate)) {
		throw new Users_Exception_NotAuthorized();
	}
	
	// Process any icon that was posted
	$icon = null;
	if (!empty($more_fields['icon']) and is_array($more_fields['icon'])) {
		$icon = $more_fields['icon'];
		unset($more_fields['icon']);
	}
	
	// OK we are good to go!
	$stream = new Streams_Stream;
	$stream->publisherId = $publisherId;
	$stream->type = $type;
	
	// handle setting of attributes
	if (isset($more_fields['attributes']) and is_array($more_fields['attributes'])) {
		foreach ($more_fields['attributes'] as $k => $v) {
			$stream->setAttribute($k, $v);
		}
		unset($more_fields['attributes']);
	}
	
	$xtype = Q_Config::get('Streams', 'types', $type, 'fields', array());
	$fieldnames = array_merge(
		array('type', 'title', 'icon', 'content', 'attributes', 'readLevel', 'writeLevel', 'adminLevel'),
		$xtype
	);
	$defaults = Q_Config::get('Streams', 'types', $type, 'defaults', array());
	foreach ($fieldnames as $f) {
		if (isset($more_fields[$f])) {
			$stream->$f = $more_fields[$f];
		} else if (array_key_exists($f, $defaults)) {
			$stream->$f = $defaults[$f];
		}
	}
	
	$stream->save();
	
	$stream->post($user->id, array(
		'type' => 'Streams/created',
		'content' => '',
		'instructions' => Q::json_encode($stream->toArray())
	), true);
	
	// Process any icon that was posted
	if (is_array($icon)) {
		$icon['subpath'] = "streams/{$stream->publisherId}/{$stream->name}";
		Q_Response::setSlot('icon', Q::event("Q/image/post", $icon));
	}
	
	if (empty($more_fields['dontSubscribe'])) {
		$stream->subscribe(); // autosubscribe to streams you yourself create, using templates
	}

	if ($relate['streamName']) {
		$result = Streams::relate(
			$user->id, 
			$relate['publisherId'], 
			$relate['streamName'], 
			$relate['type'], 
			$stream->publisherId, 
			$stream->name,
			compact('weight')
		);
		Q_Response::setSlot('messageTo', $result['messageTo']->exportArray());
	}
	
	// we have to set the access levels on the stream
	if ($publisherId != $user->id) {
		$stream = Streams::fetchOne($user->id, $publisherId, $stream->name);
	}

	Streams::$cache['stream'] = $stream;
}
