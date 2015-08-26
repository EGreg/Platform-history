<?php

/**
 * @module Streams
 */

/**
 * Used by HTTP clients to create a new stream in the system.
 * @class Streams/stream
 * @method post
 * @param {array} [$params] Parameters that can come from the request
 *   @param {string} $params.publisherId  Required. The id of the user to publish the stream.
 *   @param {string} $params.type Required. The type of the stream.
 *   @param {string} [$params.related.publisherId] Optionally indicate the publisher of the stream to relate the newly created to. Used together with the related.streamName option.
 *   @param {string} [$params.related.streamName] Optionally indicate the name of a stream to relate the newly crated stream to. This is often necessary in order to obtain permissions to create the stream.
 *   @param {bool} [$params.dontSubscribe=false] Pass 1 or true here in order to skip auto-subscribing to the newly created stream.
 *   @param {array} [$params.icon] This is used to upload a custom icon for the stream which will then be saved in different sizes. See fields for Q/image/post method
 *     @param {string} [$params.icon.data]  Required for icon. Base64-encoded image data URI - see RFC 2397
 *     @param {string} [$params.icon.path="uploads"] parent path under web dir (see subpath)
 *     @param {string} [$params.icon.subpath=""] subpath that should follow the path, to save the image under
 *     @param {string} [$params.icon.merge=""] path under web dir for an optional image to use as a background
 *     @param {string} [$params.icon.crop] array with keys "x", "y", "w", "h" to crop the original image
 *     @param {string} [$params.icon.save=array("x" => "")] array of $size => $basename pairs
 *      where the size is of the format "WxH", and either W or H can be empty.
 */
function Streams_stream_post($params = array())
{	
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
	$relate['streamName'] = Q_Request::special("Streams.related.streamName", null, $req);
	if (isset($relate['streamName'])) {
		$relate['publisherId'] = Q_Request::special("Streams.related.publisherId", $publisherId, $req);
		$relate['type'] = Q_Request::special("Streams.related.type", "", $req);
		$relate['weight'] = "+1"; // TODO: introduce ways to have "1" and "+1" for some admins etc.
	}
	
	// Hold on to any icon that was posted
	$icon = null;
	if (!empty($req['icon']) and is_array($req['icon'])) {
		$icon = $req['icon'];
		unset($req['icon']);
	}
	
	// Check if client can set the name of this stream
	if (!empty($req['name'])) {
		if ($user->id !== $publisherId
		or !Q_Config::get('Streams', 'possibleUserStreams', $req['name'], false)) {
			throw new Users_Exception_NotAuthorized();
		}
	}
	
	// Create the stream
	$stream = Streams::create($user->id, $publisherId, $type, $req, $relate);
	
	// Process any icon that was posted
	if (is_array($icon)) {
		if (empty($icon['subpath'])) {
			$icon['subpath'] = "Streams/$publisherId/{$stream->name}/icon/".time();
		}
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
