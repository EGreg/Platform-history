<?php

/**
 * Used to create a new stream
 *
 * @param array $_REQUEST 
 *   publisherId, type
 *   Q.Streams.related.publisherId, Q.Streams.related.name, Q.Streams.related.weight
 *   dontSubscribe (optional)
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
		$weight = Q_Request::special("Streams.related.weight", 1);
	}

	// See whether user is authorized to create this stream
	if (!Streams::isAuthorizedToCreate($user->id, $publisherId, $type, $relate)) {
		throw new Users_Exception_NotAuthorized();
	}
	
	// OK we are good to go!
	$stream = new Streams_Stream;
	$stream->publisherId = $publisherId;
	$stream->type = $type;
	$xtype = Q_Config::get('Streams', 'types', $type, 'fields', array());
	$fieldnames = array_merge(
		array('type', 'title', 'icon', 'content', 'attributes', 'readLevel', 'writeLevel', 'adminLevel'),
		$xtype
	);
	foreach ($fieldnames as $f) {
		if (isset($more_fields[$f])) {
			$stream->$f = $more_fields[$f];
		} else {
			try {
				$stream->$f = Q_Config::expect('Streams', 'types', $type, 'defaults', $f);
			} catch (Exception $e) {
				continue;
			}
		}
	}
	if (empty($stream->attributes)) {
		$stream->attributes = '{}';
	}
	
	$stream->save();
	
	$stream->post($user->id, array(
		'type' => 'Streams/created',
		'content' => '',
		'instructions' => Q::json_encode($stream->toArray())
	), true);
	
	if (empty($more_fields['dontSubscribe'])) {
		$stream->subscribe(); // autosubscribe to streams you yourself create, using templates
	}

	if ($relate['streamName']) {
		Streams::relate(
			$user->id, 
			$relate['publisherId'], 
			$relate['streamName'], 
			$relate['type'], 
			$stream->publisherId, 
			$stream->name,
			compact('weight')
		);
	}
	
	// we have to set the access levels on the stream
	if ($publisherId != $user->id) {
		$stream = Streams::fetchOne($user->id, $publisherId, $stream->name);
	}

	Streams::$cache['stream'] = $stream;
}
