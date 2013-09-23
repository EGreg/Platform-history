<?php

function Streams_invite_post()
{
	$publisherId = Streams::requestedPublisherId(true);
	$streamName = Streams::requestedName(true);
	
	Streams::$cache['invited'] = Streams_Stream::invite(
		$publisherId, 
		$streamName, 
		$_REQUEST, 
		$_REQUEST
	);
}
