<?php

function Websites_0_8_Streams_mysql()
{
	$userId = Q_Config::get("Websites", "user", "id", null);
	if (!$userId) {
		throw new Q_Exception('Websites: Please fill in the config field "Websites"/"user"/"id"');
	}
	
	// $now = Streams::db()->toDateTime(Streams::db()->getCurrentTimestamp());
	
	$publisherId = $userId;
	$ofUserId = '';
	$ofContactLabel = 'admins';
	$grantedByUserId = null;
	$readLevel = 40;
	$writeLevel = 30;
	$adminLevel = 40;
	
	$streams = array(
		"Websites/header" => array('type' => "Streams/image/icon", "title" => "Header image", "icon" => "default", "content" => ""),
		"Websites/slogan" => array('type' => "Streams/text/small", "title" => "Website slogan", "icon" => "default", "content" => "The coolest website"),
		"Websites/title" => array('type' => "Streams/text/small", "title" => "Website title", "icon" => "default", "content" => "Website Title"),
		"Websites/bios" => array('type' => "Streams/category", "title" => "Biographies", "icon" => "default", "content" => "Biographies", "deletable" => true),
		"Websites/gallery" =>  array('type' => "Streams/images", "title" => "Gallery", "icon" => "default", "content" => "Gallery", "deletable" => true),
		"Websites/images/" =>  array('type' => "Streams/template", "title" => "", "icon" => "default", "content" => "", "deletable" => true),
		"Websites/image/" =>  array('type' => "Streams/template", "title" => "", "icon" => "default", "content" => "", "deletable" => true),
		"Websites/bio/" =>  array('type' => "Streams/template", "title" => "", "icon" => "default", "content" => "", "deletable" => true),
	);
	
	$rows = array();
	foreach ($streams as $streamName => $stream) {
		$writeLevel = (!empty($stream['deletable'])) ? 40 : 30;
		$rows[] = compact(
			'publisherId', 'streamName', 'ofUserId', 'ofContactLabel', 
			'grantedByUserId', 'readLevel', 'writeLevel', 'adminLevel'
		);
	}
	
	Streams_Access::insertManyAndExecute($rows);
	
	$attributes = null;
	$closedTime = null;
	$readLevel = 40;
	$writeLevel = 10;
	$adminLevel = 20;
	$inheritAccess = null;
	
	$rows = array();
	foreach ($streams as $name => $s) {
		extract($s);
		$rows[] = compact(
			'publisherId', 'name', 'type', 'title', 'icon', 'content', 'attributes',
			'readLevel', 'writeLevel', 'adminLevel', 'inheritAccess', 'participantCount'
		);
	}
	
	Streams_Stream::insertManyAndExecute($rows);
	
	Streams_RelatedTo::insert(array(
		'toPublisherId' => $publisherId,
		'toStreamName' => 'Streams/images',
		'type' => 'image',
		'fromPublisherId' => $publisherId,
		'fromStreamName' => 'Streams/image'
	));
}

Websites_0_8_Streams_mysql();