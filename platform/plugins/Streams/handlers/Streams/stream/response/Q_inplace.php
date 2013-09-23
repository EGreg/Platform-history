<?php

function Streams_stream_response_Q_inplace()
{
	$user = Users::loggedInUser();
	$stream = isset(Streams::$cache['stream']) ? Streams::$cache['stream'] : null;
	if (!$stream) {
		throw new Exception("No stream");
	}
	if (isset($_REQUEST['title'])) {
		$result = $stream->title;
	} else if (isset($_REQUEST['attributes'])) {
		if (is_array($_REQUEST['attributes'])) {
			reset($_REQUEST['attributes']);
			$result = $stream->getAttribute(key($_REQUEST['attributes']));
		} else {
			$result = $stream->attributes;
		}
	} else {
		$result = $stream->content;
	}
	return Q_Html::text($result, array("\n", " "));
}