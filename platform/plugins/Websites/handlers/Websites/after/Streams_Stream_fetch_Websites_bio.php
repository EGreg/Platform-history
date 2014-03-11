<?php

function Websites_after_Streams_Stream_fetch_Websites_bio($params)
{
	$stream = $params['stream'];
	if (!$stream->wasRetrieved()) return;
	
	$b = new Websites_Bio();
	$b->publisherId = $stream->publisherId;
	$b->streamName = $stream->name;	
	$b->retrieve();
	$stream->bio = $b->bio;
	$stream->userId = $b->userId;
}