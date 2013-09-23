<?php

function Streams_subscription_response_content () {

	$publisherId = Streams::requestedPublisherId(true);
	$name = Streams::requestedName(true);
	return Q::tool('Streams/subscription', compact('publisherId', 'name'));
}