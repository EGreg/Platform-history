<?php

/**
 * Used to create a new stream
 *
 * @param {array} $_REQUEST 
 *   publisherId, type
 *   Q.Streams.related.publisherId, Q.Streams.related.name, Q.Streams.related.weight
 *   dontSubscribe (optional)
 *   icon (optional) see fields for Q/image/post
 * @return {void}
 */
function Streams_stream_post($params) {
	$user = Users::loggedInUser(true);
	$publisherId = Streams::requestedPublisherId();
	if (empty($publisherId)) {
		$publisherId = $_REQUEST['publisherId'] = $user->id;
	}
	$type = Streams::requestedType(true);
	$req = array_merge($_REQUEST, $params);

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
	
	// Hold on to any icon that was posted
	$icon = null;
	if (!empty($req['icon']) and is_array($req['icon'])) {
		$icon = $req['icon'];
		unset($req['icon']);
	}
	
	// This webservice doesn't let clients set the name of the stream
	unset($req['name']);
	
	// Create the stream
	Streams::create($user->id, $publisherId, $type, $relate, $req);
	
	// Process any icon that was posted
	if (is_array($icon)) {
		$icon['subpath'] = "streams/{$stream->publisherId}/{$stream->name}";
		Q_Response::setSlot('icon', Q::event("Q/image/post", $icon));
	}
	
	if (empty($req['dontSubscribe'])) {
		// autosubscribe to streams you yourself create, using templates
		$stream->subscribe();
	}
	
	// we have to set the access levels on the stream
	if ($publisherId != $user->id) {
		$stream = Streams::fetchOne($user->id, $publisherId, $stream->name);
	}

	Streams::$cache['stream'] = $stream;
}
