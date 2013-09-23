<?php

/**
 * This tool generates an interface used for publishing messages to streams
 * It basically renders the Streams/publish/$type tool, where $type is the stream's type.
 *
 * @param array $options
 *  An associative array of parameters, containing:
 *  "publisherId" => required. The id of the publisher of the stream to which to post the message.
 *  "streamName" => required. The name of the stream to which to post the message.
 */

function Streams_publish_tool($options)
{
	extract($options);
	if (empty($stream)) {
		throw new Q_Exception("Missing stream object");
	}
	if (!Q::canHandle('Streams/publish/'.$stream->type.'/tool')) {
		throw new Q_Exception("No publish tool has been implemented for streams of type {$stream->type}.");
	}
	return Q::tool('Streams/publish/'.$stream->type, $options);
}