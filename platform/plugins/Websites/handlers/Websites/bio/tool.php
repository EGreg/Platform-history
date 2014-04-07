<?php

function Websites_bio_tool($params)
{
	$git = isset($params['getintouch']) ? $params['getintouch'] : 'getintouch';
	$getintouch = Q::take(Q::ifset($params['getintouch']), array(
		'emailSubject' => 'Reaching out from your website',
		'classes' => 'Q_button Q_clickable'
	));
	Q_Response::addStylesheet('plugins/Websites/css/Websites.css');
	Q_Response::addScript("plugins/Websites/js/Websites.js");
	$publisherId = $params['publisherId'];
	$streamName = $params['streamName'];
	$bio = Streams::fetchOne(null, $publisherId, $streamName);
	return Q::view("Websites/tool/bio.php", 
		compact('bio', 'getintouch')
	);
}