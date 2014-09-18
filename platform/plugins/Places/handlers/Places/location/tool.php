<?php

function Places_location_tool($options)
{
	Q_Response::setToolOptions($options);
	return Q::view("Places/tool/location.php", $options);
}