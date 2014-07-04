<?php

function Streams_subscription2_response_content () {
	return Q::tool('Streams/subscription2', compact('publisherId', 'streamName'));
}