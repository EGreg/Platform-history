<?php

function Streams_subscription2_response_dialog () {
	Q_Response::addScript("plugins/Streams/js/Streams.js");
	Q_Response::addScript("plugins/Streams/js/tools/subscription2.js");

	return Q::event('Streams/subscription2/response/content');
}