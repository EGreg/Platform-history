<?php

function Streams_interests_tool($options)
{
	Q_Response::setToolOptions($options);
	return Q::view('Streams/tool/interests.php');
}