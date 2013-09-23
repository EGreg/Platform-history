<?php

function Streams_put_response_content () {

	$publisherId = Streams::requestedPublisherId();
	$name = Streams::requestedName();
	$type = Streams::requestedType();
	$title = Streams::requestedField('title');
	$content = Streams::requestedField('content');
	$readLevel = Streams::requestedField('readLevel');
	$writeLevel = Streams::requestedField('writeLevel');
	$adminLevel = Streams::requestedField('adminLevel');
	$noJoin = Streams::requestedField('noJoin');
	return Q::tool('Streams/stream', compact(
		'publisherId', 'name', 'type', 'title', 'content', 'readLevel', 'writeLevel', 'adminLevel', 'noJoin'));
}