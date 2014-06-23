<?php

function Streams_access_response_dialog()
{
	Q_Response::addScript("plugins/Q/js/tools/tabs.js");
	Q_Response::addScript("plugins/Streams/js/tools/access.js");
	Q_Response::addScript("plugins/Streams/js/Streams.js");

	return Q::event('Streams/access/response/content');
}